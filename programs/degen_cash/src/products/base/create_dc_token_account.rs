// Create User DC Token Account
// Just initializes the account, so no need to have Arcium Compute on this
use crate::base::ErrorCode;
use crate::DCUserTokenAccount;
use crate::SignerAccount;
use crate::CIRCUITS_URL;
use crate::DC_USER_TOKEN_ACCOUNT_SEED;
use crate::{ID, ID_CONST};
use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CallbackAccount, CircuitSource, OffChainCircuitSource};

// Init Comp Def
// Queue Fn
// Callback Fn

const COMP_DEF_OFFSET_CREATE_DC_TOKEN_ACCOUNT: u32 = comp_def_offset("init_user_dc_balance");

// Init Comp Def
pub fn init_create_dc_token_account_comp_def(
    ctx: Context<InitCreateDCTokenAccountCompDef>,
) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: format!("{}{}", CIRCUITS_URL, "init_user_dc_balance_testnet.arcis").to_string(),
            hash: [0; 32], // Just use zeros for now - hash verification isn't enforced yet
        })),
        None,
    )?;
    Ok(())
}

#[init_computation_definition_accounts("init_user_dc_balance", payer)]
#[derive(Accounts)]
pub struct InitCreateDCTokenAccountCompDef<'info> {
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
pub fn queue_create_dc_token_account(
    ctx: Context<QueueInitUserDcBalance>,
    computation_offset: u64,
    owner_x25519: [u8; 32],
    nonce: u128,
) -> Result<()> {
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    ctx.accounts.dc_user_token_account.owner = ctx.accounts.payer.key();
    ctx.accounts.dc_user_token_account.amount = [0; 32];
    ctx.accounts.dc_user_token_account.amount_nonce = 0;
    ctx.accounts.dc_user_token_account.owner_x25519 = owner_x25519;

    let args = vec![
        // Enc<Shared, {}> // Used to set 0 with nonce
        Argument::ArcisPubkey(owner_x25519),
        Argument::PlaintextU128(nonce),
    ];

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![InitUserDcBalanceCallback::callback_ix(&[CallbackAccount {
            pubkey: ctx.accounts.dc_user_token_account.key(),
            is_writable: true,
        }])],
    )?;

    Ok(())
}

#[queue_computation_accounts("init_user_dc_balance", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueInitUserDcBalance<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CREATE_DC_TOKEN_ACCOUNT)
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

    // DC User Token Account
    #[account(
        init,
        payer = payer,
        space = 8 + DCUserTokenAccount::INIT_SPACE,
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
}

// Callback Fn
pub fn init_user_dc_balance_callback(
    ctx: Context<InitUserDcBalanceCallback>,
    output: ComputationOutputs<InitUserDcBalanceOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(InitUserDcBalanceOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    ctx.accounts.dc_user_token_account.amount = o.ciphertexts[0];
    ctx.accounts.dc_user_token_account.amount_nonce = o.nonce;

    Ok(())
}

#[callback_accounts("init_user_dc_balance")]
#[derive(Accounts)]
pub struct InitUserDcBalanceCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CREATE_DC_TOKEN_ACCOUNT)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,

    // DC User Token Account
    #[account(mut)]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
}
