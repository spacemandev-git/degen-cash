// Deposit USDC to mint Degen Cash

use crate::base::ErrorCode;
use crate::{DCGlobalMint, DCUserTokenAccount, CIRCUITS_URL, DC_GLOBAL_MINT_SEED};
use crate::{SignerAccount, DC_USER_TOKEN_ACCOUNT_SEED};
use crate::{ID, ID_CONST};
use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CallbackAccount, CircuitSource, OffChainCircuitSource};

// Init Comp Def
// Queue Fn
// Callback Fn

const COMP_DEF_OFFSET_DEPOSIT: u32 = comp_def_offset("deposit");

// Init Comp Def
pub fn deposit_comp_def(ctx: Context<DepositCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: format!("{}{}", CIRCUITS_URL, "deposit_testnet.arcis").to_string(),
            hash: [0; 32], // Just use zeros for now - hash verification isn't enforced yet
        })),
        None,
    )?;
    Ok(())
}

#[init_computation_definition_accounts("deposit", payer)]
#[derive(Accounts)]
pub struct DepositCompDef<'info> {
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
pub fn queue_deposit(
    ctx: Context<QueueDeposit>,
    computation_offset: u64,
    nonce: u128,
) -> Result<()> {
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    let args = vec![Argument::PlaintextU128(nonce)];
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![DepositCallback::callback_ix(&[
            CallbackAccount {
                pubkey: ctx.accounts.dc_global_mint_account.key(),
                is_writable: true,
            },
            CallbackAccount {
                pubkey: ctx.accounts.dc_user_token_account.key(),
                is_writable: true,
            },
        ])],
    )?;

    Ok(())
}

#[queue_computation_accounts("deposit", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueDeposit<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_DEPOSIT)
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
    // DC Global Mint Account (read only -- used to check deposit mint key)
    #[account(
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,

    // DC User Token Account
    #[account(
        mut,
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
}

// Callback Fn
// Callback Fn
pub fn deposit_callback(
    ctx: Context<DepositCallback>,
    output: ComputationOutputs<DepositOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(DepositOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    Ok(())
}

#[callback_accounts("deposit")]
#[derive(Accounts)]
pub struct DepositCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_DEPOSIT)
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
    // no seeds constraint and check in queue instead (we don't have a way to pass user key to callback)
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
}
