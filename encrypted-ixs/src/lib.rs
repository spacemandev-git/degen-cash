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

    #[instruction]
    pub fn transfer(
        global_reserves_balance: u64,
        global_dc_balance_ctxt: Enc<Mxe, u64>,
        sender_balance_ctxt: Enc<Shared, u64>,
        receiver_balance_ctxt: Enc<Shared, u64>,
        transfer_amount: u64,
        variance: u8, // 0 - 100 (percentage)
        fee: u64,     // 1/1000 %
    ) -> (
        u8,               // Status Code
        u64,              // Transfer Amount
        u64,              // Variance
        u64,              // Fee
        Enc<Shared, u64>, // Cost to Sender
        Enc<Mxe, u64>,    // New Global Mint Balance
        Enc<Shared, u64>, // New Sender Balance
        Enc<Shared, u64>, // New Receiver Balance
    ) {
        let global_dc_balance = global_dc_balance_ctxt.to_arcis();
        let sender_balance = sender_balance_ctxt.to_arcis();
        let receiver_balance = receiver_balance_ctxt.to_arcis();

        let mut transfer_amt = transfer_amount;

        let mut status_code = 0_u8;
    }
}

//final_amt = (amt * variance) - fee + nav_adj
//amt = amt you want to send
//variance = -100 to +100 %
//fee = 50 bps at 0 variance, 0.5bps per variance step
//nav adj = -100% to N% based on degen_cash/usdc deposits
//0.5% withdrawal fee
