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
     * 1: Math Overflow
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

    /**
     * Status Codes:
     * 0: Success
     * 1: Math Overflow
     * 2: Insufficient Funds
     */
    #[instruction]
    pub fn withdraw(
        global_mint_amount_ctxt: Enc<Mxe, u64>,
        user_dc_balance_ctxt: Enc<Shared, u64>,
        withdraw_amount: u64,
    ) -> (u8, u64, Enc<Mxe, u64>, Enc<Shared, u64>) {
        let global_mint_amount = global_mint_amount_ctxt.to_arcis();
        let user_dc_balance = user_dc_balance_ctxt.to_arcis();

        let mut status_code = 0_u8;

        if withdraw_amount > user_dc_balance {
            status_code = 2; // Insufficient Funds
        }

        if withdraw_amount > global_mint_amount {
            status_code = 2; // Insufficient Funds
        }

        let new_global_mint_amount = global_mint_amount - withdraw_amount;
        let new_user_dc_balance = user_dc_balance - withdraw_amount;

        if new_global_mint_amount > global_mint_amount {
            status_code = 1; // Math Overflow
        }

        if new_user_dc_balance > user_dc_balance {
            status_code = 1; // Math Overflow
        }

        (
            status_code.reveal(),
            withdraw_amount.reveal(),
            global_mint_amount_ctxt
                .owner
                .from_arcis(new_global_mint_amount),
            user_dc_balance_ctxt.owner.from_arcis(new_user_dc_balance),
        )
    }

    pub struct SenderTransferEvent {
        pub cost_to_sender: u64,
        pub new_sender_balance: u64,
    }

    /**
     * Status Codes:
     * 0: Success
     * 1: Math Overflow
     * 2. Insufficient Funds
     */
    #[instruction]
    pub fn transfer(
        global_balance: u64, // Used to calculate NAV
        global_dc_balance_ctxt: Enc<Mxe, u64>,
        sender_balance_ctxt: Enc<Shared, u64>,
        receiver_balance_ctxt: Enc<Shared, u64>,
        transfer_amount: u64,
        max_variance: u8, // Max Variance (0 - 255) IMPORTANT THAT IT'S THE FULL RANGE (otherwise we have modulo bias)
    ) -> (
        u8,                               // Status Code
        u8, // Variance (0 - 255) IMPORTANT THAT IT'S THE FULL RANGE (otherwise we have modulo bias)
        u64, // Transfer Amount
        Enc<Shared, SenderTransferEvent>, // Cost to Sender // Saved to Recent Txn Log
        Enc<Mxe, u64>, // New Global Mint Balance
        Enc<Shared, u64>, // New Receiver Balance
    ) {
        // Returnables
        let mut status_code = 0_u8;
        let global_reserves_balance = global_balance; // todo change with bytes conversion from account read later
        let mut global_dc_balance = global_dc_balance_ctxt.to_arcis();
        let mut sender_balance = sender_balance_ctxt.to_arcis();
        let mut receiver_balance = receiver_balance_ctxt.to_arcis();
        let mut final_amount: u64 = 0;

        let max_send_amt = transfer_amount + (transfer_amount * (max_variance as u64 / 100_u64));

        if max_send_amt > global_dc_balance || max_send_amt > sender_balance {
            status_code = 2;
        }

        // Calculate Amount with Variance
        let variance_sign = ArcisRNG::bool(); // true is positive, false is negative
        let variance_rng = ArcisRNG::gen_integer_from_width(8) % (max_variance as u128 + 1); // 0 - max_variance
        let amount_with_variance = {
            if variance_sign {
                transfer_amount as u128 + variance_rng
            } else {
                transfer_amount as u128 - variance_rng
            }
        };

        // Calculate the Fee based off Max Variance
        let fee = transfer_amount as u128 * (255_u128 - max_variance as u128) / 255_u128;

        // Calculate the NAV Adjustment
        let nav_percentage = if global_dc_balance == global_reserves_balance {
            0_u64
        } else if global_dc_balance > global_reserves_balance {
            // positive percentage
            ((global_dc_balance as u128 / global_reserves_balance as u128) * 100_u128) as u64
        } else {
            // negative percentage
            ((global_dc_balance as u128 / 100_u128) * global_reserves_balance as u128) as u64
        };
        let nav_adjustment = transfer_amount as u128 * nav_percentage as u128 / 100_u128;
        final_amount = (amount_with_variance as u128 - fee + nav_adjustment) as u64;

        if final_amount > sender_balance
            || receiver_balance + final_amount < receiver_balance // overflow check
            || global_dc_balance + final_amount < global_dc_balance // underflow check (global_dc_balance is always greater than final_amount)
            || final_amount > global_dc_balance
        {
            status_code = 1;
            final_amount = 0;
        } else {
            global_dc_balance = {
                if final_amount > transfer_amount {
                    // socialized win, cost more than what they wanted to send, extra balance is burned
                    global_dc_balance - (final_amount - transfer_amount)
                } else if final_amount < transfer_amount {
                    // socialized loss, cost less than what they wanted to send, extra balance is added
                    global_dc_balance + (transfer_amount - final_amount)
                } else {
                    // exact match, no extra balance is added or burned
                    global_dc_balance
                }
            };
            sender_balance = sender_balance - final_amount;
            receiver_balance = receiver_balance + final_amount;
        }

        (
            status_code.reveal(),
            max_variance.reveal(),
            transfer_amount.reveal(),
            sender_balance_ctxt.owner.from_arcis(SenderTransferEvent {
                cost_to_sender: fee as u64,
                new_sender_balance: sender_balance,
            }),
            global_dc_balance_ctxt.owner.from_arcis(global_dc_balance),
            receiver_balance_ctxt.owner.from_arcis(receiver_balance),
        )
    }
}

//final_amt = (amt * rnd(variance)) - fee + nav_adj
//amt = amt you want to send
//variance = -100 to +100 % (u8 as 0-100)
//fee = 0bps to 255bps (0 variance = 255bps, 100 variance = 0bps)
//nav adj = -100% to N% based on degen_cash/usdc deposits
//0.5% withdrawal fee
