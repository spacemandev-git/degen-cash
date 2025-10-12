// Create User DC Token Account
// Just initializes the account, so no need to have Arcium Compute on this
use anchor_lang::prelude::*;

use crate::DCUserTokenAccount;
use crate::DC_USER_TOKEN_ACCOUNT_SEED;

pub fn create_dc_token_account(ctx: Context<CreateDCTokenAccount>) -> Result<()> {
    ctx.accounts.dc_user_token_account.owner = ctx.accounts.payer.key();
    ctx.accounts.dc_user_token_account.amount = [0; 32];
    ctx.accounts.dc_user_token_account.amount_nonce = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateDCTokenAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = payer,
        space = 8 + DCUserTokenAccount::INIT_SPACE,
        seeds = [DC_USER_TOKEN_ACCOUNT_SEED.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub dc_user_token_account: Account<'info, DCUserTokenAccount>,
}
