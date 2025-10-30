// Transfer Degen Cash from user to user

// Init Comp Def
// Queue Fn
// Callback Fn

use crate::base::ErrorCode;
use crate::{DCGlobalMint, DCUserTokenAccount, CIRCUITS_URL, DC_GLOBAL_MINT_SEED};
use crate::{SignerAccount, DC_USER_TOKEN_ACCOUNT_SEED};
use crate::{ID, ID_CONST};
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CallbackAccount, CircuitSource, OffChainCircuitSource};

// Init Comp Def
const COMP_DEF_OFFSET_TRANSFER: u32 = comp_def_offset("transfer");

// Init Comp Def
pub fn init_transfer_comp_def(ctx: Context<InitTransferCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: format!("{}{}", CIRCUITS_URL, "transfer_testnet.arcis").to_string(),
            hash: [0; 32], // Just use zeros for now - hash verification isn't enforced yet
        })),
        None,
    )?;
    Ok(())
}

#[init_computation_definition_accounts("transfer", payer)]
#[derive(Accounts)]
pub struct InitTransferCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

// Queue Fn
pub fn queue_transfer(
    ctx: Context<QueueTransfer>,
    computation_offset: u64,
    transfer_amount: u64,
    max_variance: u8,
    _reciever_pubkey: Pubkey, // used in constraints
) -> Result<()> {
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    if transfer_amount > 1000_000000 {
        return Err(ErrorCode::MaxTransferAmountExceeded.into());
    }

    let args = vec![
        // Global Reserves Balance (u64) - used to calculate NAV
        Argument::PlaintextU64(ctx.accounts.deposit_mint.supply),
        // Global DC Balance (Enc<Mxe, u64>)
        Argument::PlaintextU128(ctx.accounts.dc_global_mint_account.supply_nonce),
        Argument::Account(ctx.accounts.dc_global_mint_account.key(), 8 + 32, 32),
        // Sender Balance (Enc<Shared, u64>)
        Argument::ArcisPubkey(ctx.accounts.dc_user_token_account.owner_x25519),
        Argument::PlaintextU128(ctx.accounts.dc_user_token_account.amount_nonce),
        Argument::Account(ctx.accounts.dc_user_token_account.key(), 8 + 32 + 32, 32),
        // Receiver Balance (Enc<Shared, u64>)
        Argument::ArcisPubkey(ctx.accounts.receiver_dc_user_token_account.owner_x25519),
        Argument::PlaintextU128(ctx.accounts.receiver_dc_user_token_account.amount_nonce),
        Argument::Account(
            ctx.accounts.receiver_dc_user_token_account.key(),
            8 + 32 + 32,
            32,
        ),
        // Transfer Amount (u64)
        Argument::PlaintextU64(transfer_amount),
        // Max Variance (u8) (0 - 255) important it's full range otherwise we have modulo bias
        Argument::PlaintextU8(max_variance),
    ];

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![TransferCallback::callback_ix(&[
            CallbackAccount {
                pubkey: ctx.accounts.dc_global_mint_account.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.dc_user_token_account.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.receiver_dc_user_token_account.key(),
                is_writable: true,
            },
        ])],
    )?;

    Ok(())
}

#[queue_computation_accounts("transfer", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64, transfer_amount: u64, max_variance: u8, _reciever_pubkey: Pubkey)]
pub struct QueueTransfer<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_TRANSFER)
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
    // Custom Accounts
    #[account(
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,
    #[account(
        address = dc_global_mint_account.deposit_mint
    )]
    pub deposit_mint: Account<'info, Mint>,
    // DC User Token Account
    #[account(
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
    // Receiver DC User Token Account
    #[account(
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), _reciever_pubkey.as_ref()],
        bump,
    )]
    pub receiver_dc_user_token_account: Account<'info, DCUserTokenAccount>,
}

#[event]
pub struct TransferEvent {
    pub status_code: u8,
    pub variance: u8,
    pub transfer_amount: u64,
    pub new_sender_balance: [u8; 32],
    pub new_global_mint_balance: [u8; 32],
    pub new_receiver_balance: [u8; 32],
}

pub fn transfer_callback(
    ctx: Context<TransferCallback>,
    output: ComputationOutputs<TransferOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(TransferOutput {
            field_0:
                TransferOutputStruct0 {
                    field_0: status_code,
                    field_1: variance,
                    field_2: transfer_amount,
                    field_3: new_sender_balance,
                    field_4: new_global_mint_balance,
                    field_5: new_receiver_balance,
                },
        }) => (
            status_code,
            variance,
            transfer_amount,
            new_sender_balance,
            new_global_mint_balance,
            new_receiver_balance,
        ),
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(TransferEvent {
        status_code: o.0,
        variance: o.1,
        transfer_amount: o.2,
        new_sender_balance: o.3.ciphertexts[0],
        new_global_mint_balance: o.4.ciphertexts[0],
        new_receiver_balance: o.5.ciphertexts[0],
    });

    match o.0 {
        0 => {
            ctx.accounts.dc_global_mint_account.supply = o.4.ciphertexts[0];
            ctx.accounts.dc_global_mint_account.supply_nonce = o.4.nonce;
            ctx.accounts.dc_user_token_account.amount = o.3.ciphertexts[0];
            ctx.accounts.dc_user_token_account.amount_nonce = o.3.nonce;
            ctx.accounts.receiver_dc_user_token_account.amount = o.5.ciphertexts[0];
            ctx.accounts.receiver_dc_user_token_account.amount_nonce = o.5.nonce;
            Ok(())
        }
        _ => Ok(()), // leave things as they are if error in arcis
    }
}

// Callback Fn
#[callback_accounts("transfer")]
#[derive(Accounts)]
pub struct TransferCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_TRANSFER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
    // DC Global Mint Account
    #[account(
        mut,
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,
    // DC User Token Account
    #[account(mut)]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
    // Receiver DC User Token Account
    #[account(mut)]
    pub receiver_dc_user_token_account: Account<'info, DCUserTokenAccount>,
}
