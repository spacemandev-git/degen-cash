use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct EmptyStruct;

    #[instruction]
    pub fn init_global_dc_mint(input_ctxt: Enc<Mxe, EmptyStruct>) -> Enc<Mxe, u64> {
        input_ctxt.owner.from_arcis(0_u64)
    }

    #[instruction]
    pub fn init_user_dc_balance(owner_ctxt: Enc<Shared, EmptyStruct>) -> Enc<Shared, u64> {
        owner_ctxt.owner.from_arcis(0_u64)
    }

    /**
     * Status Codes:
     * 0: Success
     * 1: Bad Math
     */
    #[instruction]
    pub fn deposit(
        global_mint_amount_ctxt: Enc<Mxe, u64>,
        user_dc_balance_ctxt: Enc<Shared, u64>,
        deposit_amount: u64,
    ) -> (u8, u64, Enc<Mxe, u64>, Enc<Shared, u64>) {
        //Add deposit amount to existing encrypted amount
        let global_mint_amount = global_mint_amount_ctxt.to_arcis();
        let user_dc_balance = user_dc_balance_ctxt.to_arcis();
        let new_global_mint_amount = global_mint_amount + deposit_amount;
        let new_user_dc_balance = user_dc_balance + deposit_amount;

        let mut status_code = 0_u8;

        if new_global_mint_amount < global_mint_amount {
            status_code = 1;
        }

        if new_user_dc_balance < user_dc_balance {
            status_code = 1;
        }

        (
            status_code.reveal(),
            deposit_amount.reveal(),
            global_mint_amount_ctxt
                .owner
                .from_arcis(new_global_mint_amount),
            user_dc_balance_ctxt.owner.from_arcis(new_user_dc_balance),
        )
    }
}
