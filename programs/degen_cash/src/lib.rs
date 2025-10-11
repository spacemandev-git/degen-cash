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
        venmo::init_global_dc_mint_comp_def(ctx)?;
        Ok(())
    }

    pub fn queue_init_global_dc_mint(
        ctx: Context<QueueInitGlobalDCMint>,
        computation_offset: u64,
        nonce: u128,
        deposit_mint: Pubkey,
    ) -> Result<()> {
        venmo::queue_init_global_dc_mint(ctx, computation_offset, nonce, deposit_mint)?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_global_dc_mint")]
    pub fn init_global_dc_mint_callback(
        ctx: Context<InitGlobalDcMintCallback>,
        output: ComputationOutputs<InitGlobalDcMintOutput>,
    ) -> Result<()> {
        venmo::init_global_dc_mint_callback(ctx, output)?;
        Ok(())
    }

    // Escrow

    // Lottery
}
