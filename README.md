# Degen Cash

## Degen Venmo
- [DONE] Init DC Global Mint
- [DONE] Create DC Token Account
- [DONE] Deposit
- [DONE] Transfer
- Withdraw
- [DONE] Check Balance (only client side, not a fn)

### Transfer Function

The transfer function enables private, obfuscated value transfers between users with dynamic pricing based on variance selection and system health (NAV).

**Key Features:**
1. **Receiver Guarantee**: Receiver always receives exactly the `transfer_amount` specified
2. **Sender Variance**: Sender chooses `max_variance` (0-255) which determines:
   - Maximum possible variance in their cost (higher variance = more cost uncertainty)
   - Fee rate: `(255 - max_variance)` basis points (lower variance = higher fee)
   - Example: `max_variance=0` means 255 bps (2.55%) fee, `max_variance=255` means 0 bps fee
3. **Random Cost Adjustment**: A rejection-sampled random number (0 to `max_variance`) determines actual variance applied
   - Random boolean determines if sender pays MORE or LESS than transfer amount
   - If TRUE: sender pays `transfer_amount - (transfer_amount × variance_roll / 255)`
   - If FALSE: sender pays `transfer_amount + (transfer_amount × variance_roll / 255)`
4. **NAV-Based Adjustment**: System health affects final cost
   - NAV% = (DC Balance / Reserves) × 100
   - If NAV < 100% (more reserves than DC): sender gets discount of `(100 - NAV%)` basis points on `transfer_amount`
   - If NAV > 100% (more DC than reserves): sender pays penalty of `NAV%` basis points on `transfer_amount`
5. **Socialized Gains/Losses**: Difference between sender payment and receiver amount adjusts global DC balance
   - Creates social win (DC burns) when sender pays less than receiver gets
   - Creates social loss (DC mints) when sender pays more than receiver gets
6. **Safety Checks**:
   - Sender must have enough balance to cover worst-case scenario: `transfer_amount + max_variance_amount + fee`
   - If actual cost exceeds balance, sender's balance is zeroed (no error, just caps at available)
   - Overflow protection on receiver balance

**Status Codes:**
- 0: Success
- 1: Math Overflow
- 2: Insufficient Funds (worst-case check failed)
- 3: RNG Failure (couldn't generate valid random number in 10 attempts)

## Degen Escrow
- create escrow
- deposit into escrow
- unlock for member
- redeem escrow
- burn escrow

## Degen Lottery
- create lottery
- mint nft ticket
- ...