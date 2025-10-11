use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DCGlobalMint {
    pub deposit_mint: Pubkey,
    pub supply: [u8; 32],
    pub supply_nonce: u128,
}
