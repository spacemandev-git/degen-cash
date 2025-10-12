use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DCGlobalMint {
    pub deposit_mint: Pubkey,
    pub supply: [u8; 32],
    pub supply_nonce: u128,
}

#[account]
#[derive(InitSpace)]
pub struct DCUserTokenAccount {
    pub owner: Pubkey,
    pub amount: [u8; 32],
    pub amount_nonce: u128,
}
