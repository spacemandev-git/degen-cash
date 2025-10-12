// Initialize the global mint account for Degen Cash
use crate::base::ErrorCode;
use crate::SignerAccount;
use crate::{DCGlobalMint, CIRCUITS_URL, DC_GLOBAL_MINT_SEED};
use crate::{ID, ID_CONST};
use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CallbackAccount, CircuitSource, OffChainCircuitSource};

// Init comp def for init_global_dc_mint
// Ix to call init_global_dc_mint
// Callback to set the global mint account

const COMP_DEF_OFFSET_INIT_GLOBAL_DC_MINT: u32 = comp_def_offset("init_global_dc_mint");

// Init Comp Def Fn
pub fn init_global_dc_mint_comp_def(ctx: Context<InitGlobalDCMintCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: format!("{}{}", CIRCUITS_URL, "init_global_dc_mint_testnet.arcis").to_string(),
            hash: [0; 32], // Just use zeros for now - hash verification isn't enforced yet
        })),
        None,
    )?;
    Ok(())
}

#[init_computation_definition_accounts("init_global_dc_mint", payer)]
#[derive(Accounts)]
pub struct InitGlobalDCMintCompDef<'info> {
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
pub fn queue_init_global_dc_mint(
    ctx: Context<QueueInitGlobalDCMint>,
    computation_offset: u64,
    nonce: u128,
    deposit_mint: Pubkey,
) -> Result<()> {
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    ctx.accounts.dc_global_mint_account.deposit_mint = deposit_mint;
    ctx.accounts.dc_global_mint_account.supply = [0; 32];
    ctx.accounts.dc_global_mint_account.supply_nonce = nonce;

    let args = vec![Argument::PlaintextU128(nonce)];
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![InitGlobalDcMintCallback::callback_ix(&[CallbackAccount {
            pubkey: ctx.accounts.dc_global_mint_account.key(),
            is_writable: true,
        }])],
    )?;

    Ok(())
}

#[queue_computation_accounts("init_global_dc_mint", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueInitGlobalDCMint<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_GLOBAL_DC_MINT)
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
    // DC Global Mint Account
    #[account(
        init,
        payer = payer,
        space = 8 + DCGlobalMint::INIT_SPACE,
        seeds = [DC_GLOBAL_MINT_SEED.as_bytes()],
        bump,
    )]
    pub dc_global_mint_account: Account<'info, DCGlobalMint>,
}

// Callback Fn
pub fn init_global_dc_mint_callback(
    ctx: Context<InitGlobalDcMintCallback>,
    output: ComputationOutputs<InitGlobalDcMintOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(InitGlobalDcMintOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    ctx.accounts.dc_global_mint_account.supply = o.ciphertexts[0];

    emit!(InitGlobalDcMintEvent {
        encrypted_data: o.ciphertexts[0]
    });

    Ok(())
}

#[event]
pub struct InitGlobalDcMintEvent {
    pub encrypted_data: [u8; 32],
}

#[callback_accounts("init_global_dc_mint")]
#[derive(Accounts)]
pub struct InitGlobalDcMintCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_GLOBAL_DC_MINT)
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
}
