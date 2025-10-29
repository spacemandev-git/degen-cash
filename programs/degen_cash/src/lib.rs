#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

pub mod products;
pub use products::*;

declare_id!("955SPKk3hC8cbqmophEAMigzaPDBrtHnVzWWS8JN6tr");

#[arcium_program]
pub mod degen_cash {
    use super::*;

    // Venmo
    pub fn init_global_dc_mint_comp_def(ctx: Context<InitGlobalDCMintCompDef>) -> Result<()> {
        base::init_global_dc_mint_comp_def(ctx)?;
        Ok(())
    }

    pub fn queue_init_global_dc_mint(
        ctx: Context<QueueInitGlobalDCMint>,
        computation_offset: u64,
        nonce: u128,
        deposit_mint: Pubkey,
    ) -> Result<()> {
        base::queue_init_global_dc_mint(ctx, computation_offset, nonce, deposit_mint)?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_global_dc_mint")]
    pub fn init_global_dc_mint_callback(
        ctx: Context<InitGlobalDcMintCallback>,
        output: ComputationOutputs<InitGlobalDcMintOutput>,
    ) -> Result<()> {
        base::init_global_dc_mint_callback(ctx, output)?;
        Ok(())
    }

    pub fn init_create_dc_token_account_comp_def(
        ctx: Context<InitCreateDCTokenAccountCompDef>,
    ) -> Result<()> {
        base::init_create_dc_token_account_comp_def(ctx)?;
        Ok(())
    }

    pub fn queue_create_dc_token_account(
        ctx: Context<QueueInitUserDcBalance>,
        computation_offset: u64,
        owner_x25519: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        base::queue_create_dc_token_account(ctx, computation_offset, owner_x25519, nonce)?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_user_dc_balance")]
    pub fn init_user_dc_balance_callback(
        ctx: Context<InitUserDcBalanceCallback>,
        output: ComputationOutputs<InitUserDcBalanceOutput>,
    ) -> Result<()> {
        base::init_user_dc_balance_callback(ctx, output)?;
        Ok(())
    }

    pub fn init_deposit_comp_def(ctx: Context<InitDepositCompDef>) -> Result<()> {
        base::init_deposit_comp_def(ctx)?;
        Ok(())
    }

    pub fn queue_deposit(
        ctx: Context<QueueDeposit>,
        computation_offset: u64,
        deposit_amount: u64,
    ) -> Result<()> {
        base::queue_deposit(ctx, computation_offset, deposit_amount)?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "deposit")]
    pub fn deposit_callback(
        ctx: Context<DepositCallback>,
        output: ComputationOutputs<DepositOutput>,
    ) -> Result<()> {
        base::deposit_callback(ctx, output)?;
        Ok(())
    }

    pub fn init_transfer_comp_def(ctx: Context<InitTransferCompDef>) -> Result<()> {
        base::init_transfer_comp_def(ctx)?;
        Ok(())
    }

    pub fn queue_transfer(
        ctx: Context<QueueTransfer>,
        computation_offset: u64,
        transfer_amount: u64,
        max_variance: u8,
        _reciever_pubkey: Pubkey,
    ) -> Result<()> {
        base::queue_transfer(
            ctx,
            computation_offset,
            transfer_amount,
            max_variance,
            _reciever_pubkey,
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "transfer")]
    pub fn transfer_callback(
        ctx: Context<TransferCallback>,
        output: ComputationOutputs<TransferOutput>,
    ) -> Result<()> {
        base::transfer_callback(ctx, output)?;
        Ok(())
    }

    // Escrow

    // Lottery
}
