use crate::base::ErrorCode;
use crate::{DCGlobalMint, DCUserTokenAccount, CIRCUITS_URL, DC_GLOBAL_MINT_SEED};
use crate::{SignerAccount, DC_USER_TOKEN_ACCOUNT_SEED};
use crate::{ID, ID_CONST};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer, Transfer};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CallbackAccount, CircuitSource, OffChainCircuitSource};

const COMP_DEF_OFFSET_WITHDRAW: u32 = comp_def_offset("withdraw");

pub fn init_withdraw_comp_def(ctx: Context<InitWithdrawCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: format!("{}{}", CIRCUITS_URL, "withdraw_testnet.arcis").to_string(),
            hash: [0; 32],
        })),
        None,
    )?;
    Ok(())
}

#[init_computation_definition_accounts("withdraw", payer)]
#[derive(Accounts)]
pub struct InitWithdrawCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

pub fn queue_withdraw(
    ctx: Context<QueueWithdraw>,
    computation_offset: u64,
    withdraw_amount: u64,
) -> Result<()> {
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    let args = vec![
        Argument::PlaintextU128(ctx.accounts.dc_global_mint_account.supply_nonce),
        Argument::Account(ctx.accounts.dc_global_mint_account.key(), 8 + 32, 32),
        Argument::ArcisPubkey(ctx.accounts.dc_user_token_account.owner_x25519),
        Argument::PlaintextU128(ctx.accounts.dc_user_token_account.amount_nonce),
        Argument::Account(ctx.accounts.dc_user_token_account.key(), 8 + 32 + 32, 32),
        Argument::PlaintextU64(withdraw_amount),
    ];

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![WithdrawCallback::callback_ix(&[
            CallbackAccount {
                pubkey: ctx.accounts.dc_global_mint_account.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.dc_user_token_account.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.payer.key(),
                is_writable: false,
            },
            CallbackAccount {
                pubkey: ctx.accounts.to_ata.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.withdraw_ata.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.withdraw_mint.key(),
                is_writable: false,
            },
            CallbackAccount {
                pubkey: ctx.accounts.token_program.key(),
                is_writable: false,
            },
            CallbackAccount {
                pubkey: ctx.accounts.associated_token_program.key(),
                is_writable: false,
            },
        ])],
    )?;

    Ok(())
}

#[queue_computation_accounts("withdraw", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueWithdraw<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_WITHDRAW)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,

    #[account(
        mut,
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,

    #[account(
        mut,
        associated_token::mint = withdraw_mint,
        associated_token::authority = dc_global_mint_account,
    )]
    pub withdraw_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = withdraw_mint,
        associated_token::authority = payer,
    )]
    pub to_ata: InterfaceAccount<'info, TokenAccount>,

    pub withdraw_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[event]
pub struct WithdrawEvent {
    pub status_code: u8,
    pub withdraw_amount: u64,
    pub new_global_mint_amount: [u8; 32],
    pub new_user_dc_balance: [u8; 32],
}

pub fn withdraw_callback(
    ctx: Context<WithdrawCallback>,
    output: ComputationOutputs<WithdrawOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(WithdrawOutput {
            field_0:
                WithdrawOutputStruct0 {
                    field_0: status_code,
                    field_1: withdraw_amount,
                    field_2: new_global_mint_amount,
                    field_3: new_user_dc_balance,
                },
        }) => (
            status_code,
            withdraw_amount,
            new_global_mint_amount,
            new_user_dc_balance,
        ),
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(WithdrawEvent {
        status_code: o.0,
        withdraw_amount: o.1,
        new_global_mint_amount: o.2.ciphertexts[0],
        new_user_dc_balance: o.3.ciphertexts[0],
    });

    if o.0 != 0 {
        return Ok(());
    }

    let dc_global_mint_account_signer_seeds = &[
        DC_GLOBAL_MINT_SEED.as_bytes(),
        &[ctx.bumps.dc_global_mint_account],
    ];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.dc_withdraw_ata.to_account_info(),
                to: ctx.accounts.user_ata.to_account_info(),
                authority: ctx.accounts.dc_global_mint_account.to_account_info(),
            },
            &[dc_global_mint_account_signer_seeds],
        ),
        o.1,
    )?;

    ctx.accounts.dc_global_mint_account.supply = o.2.ciphertexts[0];
    ctx.accounts.dc_global_mint_account.supply_nonce = o.2.nonce;
    ctx.accounts.dc_user_token_account.amount = o.3.ciphertexts[0];
    ctx.accounts.dc_user_token_account.amount_nonce = o.3.nonce;

    Ok(())
}

#[callback_accounts("withdraw")]
#[derive(Accounts)]
pub struct WithdrawCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_WITHDRAW)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,

    #[account(mut)]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,

    /// CHECK: user_signer, trust Arcium to send us the right account based on queue ix
    pub user_signer: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = dc_global_mint_account.deposit_mint,
        associated_token::authority = user_signer,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = dc_global_mint_account.deposit_mint,
        associated_token::authority = dc_global_mint_account,
    )]
    pub dc_withdraw_ata: InterfaceAccount<'info, TokenAccount>,

    pub deposit_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
