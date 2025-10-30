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

    /**
     * Status Codes:
     * 0: Success
     * 1: Math Overflow
     * 2: Insufficient Funds
     * 3: RNG Failure (couldn't generate valid random number)
     */
    #[instruction]
    pub fn transfer(
        global_balance: u64,
        global_dc_balance_ctxt: Enc<Mxe, u64>,
        sender_balance_ctxt: Enc<Shared, u64>,
        receiver_balance_ctxt: Enc<Shared, u64>,
        transfer_amount: u64,
        max_variance: u8,
    ) -> (
        u8,
        u8,
        u64,
        Enc<Shared, u64>,
        Enc<Mxe, u64>,
        Enc<Shared, u64>,
    ) {
        let mut status_code = 0_u8;
        let global_reserves_balance = global_balance;
        let mut global_dc_balance = global_dc_balance_ctxt.to_arcis();
        let mut sender_balance = sender_balance_ctxt.to_arcis();
        let mut receiver_balance = receiver_balance_ctxt.to_arcis();
        let mut actual_variance_roll = 0_u8;

        let variance_roll = if max_variance == 0 {
            0_u128
        } else {
            let range_size = (max_variance as u128) + 1;
            let rejection_threshold = 256_u128 - (256_u128 % range_size);

            let mut found_valid = 0_u8;
            let mut result = 0_u128;

            for _ in 0..10 {
                let candidate = if found_valid == 0 {
                    ArcisRNG::gen_integer_from_width(8)
                } else {
                    0_u128
                };

                let is_valid = if candidate < rejection_threshold {
                    1_u8
                } else {
                    0_u8
                };

                let should_update = if found_valid == 0 { is_valid } else { 0_u8 };
                result = if should_update == 1 {
                    candidate % range_size
                } else {
                    result
                };
                found_valid = if should_update == 1 {
                    1_u8
                } else {
                    found_valid
                };
            }

            if found_valid == 0 {
                status_code = 3;
            }

            result
        };

        if status_code == 0 {
            actual_variance_roll = variance_roll as u8;

            let variance_bool = ArcisRNG::bool();
            let variance_adjustment = (transfer_amount as u128 * variance_roll) / 255_u128;

            let modified_transfer = if variance_bool {
                transfer_amount as u128 - variance_adjustment
            } else {
                transfer_amount as u128 + variance_adjustment
            };

            let fee_bps = 255_u128 - max_variance as u128;
            let fee_amount = (transfer_amount as u128 * fee_bps) / 10000_u128;

            let modified_with_fee = modified_transfer + fee_amount;

            let nav_percent = if global_reserves_balance > 0 {
                (global_dc_balance as u128 * 100_u128) / global_reserves_balance as u128
            } else {
                100_u128
            };

            let modified_with_nav = if nav_percent < 100 {
                let discount_bps = 100_u128 - nav_percent;
                let nav_adjustment = (transfer_amount as u128 * discount_bps) / 10000_u128;
                if modified_with_fee > nav_adjustment {
                    modified_with_fee - nav_adjustment
                } else {
                    0_u128
                }
            } else if nav_percent > 100 {
                let penalty_bps = nav_percent;
                let nav_adjustment = (transfer_amount as u128 * penalty_bps) / 10000_u128;
                modified_with_fee + nav_adjustment
            } else {
                modified_with_fee
            };

            let worst_case_variance = (transfer_amount as u128 * max_variance as u128) / 255_u128;
            let worst_case_fee =
                (transfer_amount as u128 * (255_u128 - max_variance as u128)) / 10000_u128;
            let worst_case_charge = transfer_amount as u128 + worst_case_variance + worst_case_fee;

            if worst_case_charge > sender_balance as u128 {
                status_code = 2;
            }

            if (receiver_balance as u128) + (transfer_amount as u128) < (receiver_balance as u128) {
                status_code = 1;
            }

            if status_code == 0 {
                let final_sender_charge = if modified_with_nav > sender_balance as u128 {
                    sender_balance
                } else {
                    modified_with_nav as u64
                };

                sender_balance = sender_balance - final_sender_charge;
                receiver_balance = receiver_balance + transfer_amount;

                let global_dc_delta = (final_sender_charge as i128) - (transfer_amount as i128);
                if global_dc_delta > 0 {
                    global_dc_balance = global_dc_balance + (global_dc_delta as u64);
                } else if global_dc_delta < 0 {
                    let burn_amount = (-global_dc_delta) as u64;
                    if global_dc_balance >= burn_amount {
                        global_dc_balance = global_dc_balance - burn_amount;
                    } else {
                        global_dc_balance = 0;
                    }
                }
            }
        }

        (
            status_code.reveal(),
            actual_variance_roll.reveal(),
            transfer_amount.reveal(),
            sender_balance_ctxt.owner.from_arcis(sender_balance),
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
