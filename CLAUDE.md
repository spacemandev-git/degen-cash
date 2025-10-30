# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Degen Cash is a suite of experimental Solana programs leveraging Arcium encrypted computation for privacy-preserving financial products. The core innovation is an **encrypted and unknown peg ratio** between DC tokens and USDC reserves, with automatic minting/burning through user transactions.

**Key Concept**: The NAV (DC Supply / USDC Reserves) is stored encrypted using Arcium MPC and never revealed to users, enabling privacy-preserving transfers with socialized gains/losses.

## Build and Test Commands

### Prerequisites
- Docker must be running (for Arcium local MPC network)
- One-time setup: `arcium keys sync` (syncs MPC node keys to local device)

### Common Commands

```bash
# Run full test suite (starts Arcium network + Solana validator)
arcium test

# Build Anchor programs
anchor build

# Lint check
yarn lint

# Lint fix
yarn lint:fix
```

### Testing Notes
- Test suite located in `tests/degen_cash.ts`
- `arcium test` handles starting Docker, Arcium MPC nodes, and Solana validator automatically
- Test logs saved to `tests/test-run-{timestamp}.txt` after each run
- Uses Anchor's event listening system to await encrypted computation callbacks

## Architecture

### Dual-Program Architecture

Degen Cash splits logic between two programs:

1. **`programs/degen_cash/`** - Anchor program (Solana on-chain)
   - Account validation and instruction dispatching
   - Calls Arcium program for encrypted computations
   - Handles callbacks after MPC completes

2. **`encrypted-ixs/`** - Arcium encrypted circuits
   - All sensitive computations (balance updates, NAV calculations)
   - Compiled to `.arcis` format and served separately
   - Executed by Arcium MPC nodes in encrypted context

### Instruction Flow Pattern

Every encrypted operation follows a 3-step pattern:

1. **`init_*_comp_def`** - Initialize computation definition (one-time setup)
   - Registers the encrypted circuit with Arcium
   - Links to circuit URL (e.g., `transfer_testnet.arcis`)

2. **`queue_*`** - Queue encrypted computation
   - Validates accounts and inputs
   - Submits computation request to Arcium mempool
   - MPC nodes execute encrypted circuit

3. **`*_callback`** - Process computation results
   - Receives encrypted outputs from Arcium
   - Updates on-chain account state
   - Emits events with status codes

**Example**: Transfer instruction
- `init_transfer_comp_def` → registers circuit
- `queue_transfer` → submits to MPC with sender/receiver/amount/variance
- `transfer_callback` → receives new balances, updates accounts

### Encryption Contexts

Two types of encrypted state in Arcium:

- **`Enc<Mxe, u64>`** - MXE (Multi-Party Execution) Context
  - Global system state accessible only by MPC nodes
  - Used for: Global DC supply (`DCGlobalMint.supply`)
  - Never decryptable by individual users

- **`Enc<Shared, u64>`** - Shared Context
  - User-specific encrypted state
  - Used for: Individual DC balances (`DCUserTokenAccount.amount`)
  - Decryptable by user with their x25519 private key
  - Tests use `RescueCipher` to decrypt: `cipher.decrypt([amount], nonce)`

### Key Data Structures

**`DCGlobalMint`** (`programs/degen_cash/src/products/base/state.rs:3`)
- Stores encrypted global DC supply in MXE context
- `supply: [u8; 32]` - encrypted total DC minted
- `supply_nonce: u128` - nonce for encryption
- `deposit_mint: Pubkey` - USDC mint address
- PDA seed: `DC_GLOBAL_MINT_SEED`

**`DCUserTokenAccount`** (`programs/degen_cash/src/products/base/state.rs:11`)
- Stores encrypted user balance in Shared context
- `amount: [u8; 32]` - encrypted user DC balance
- `amount_nonce: u128` - nonce for decryption
- `owner_x25519: [u8; 32]` - user's x25519 public key for shared secret
- PDA seed: `[DC_USER_TOKEN_ACCOUNT_SEED, owner.key().as_ref()]`

## Product Structure

Products are modular under `programs/degen_cash/src/products/`:

- **`base/`** - Core DC functionality (✅ Complete)
  - `init.rs` - Initialize global DC mint
  - `create_dc_token_account.rs` - Create user DC accounts
  - `deposit.rs` - USDC → DC minting
  - `transfer.rs` - Variance-based transfers
  - `withdraw.rs` - DC → USDC burning
  - `consts.rs` - Circuit URLs, PDA seeds
  - `state.rs` - Account structures
  - `error.rs` - Error codes

- **`escrow/`** - Time-locked escrow (🚧 Planned)
- **`lotto/`** - Lottery system (🚧 Planned)

Each product follows the same 3-step encrypted instruction pattern.

## Encrypted Circuit Implementation

The `encrypted-ixs/src/lib.rs` file contains all MPC computation logic using Arcium's `arcis_imports`:

### Circuit Patterns

```rust
#[encrypted]
mod circuits {
    #[instruction]
    pub fn my_instruction(
        global_ctxt: Enc<Mxe, u64>,      // MXE encrypted input
        user_ctxt: Enc<Shared, u64>,     // Shared encrypted input
        plaintext_param: u64,             // Public input
    ) -> (u8, Enc<Mxe, u64>, Enc<Shared, u64>) {
        // Extract encrypted values
        let global_val = global_ctxt.to_arcis();
        let user_val = user_ctxt.to_arcis();

        // Perform encrypted computation
        let new_global = global_val + plaintext_param;
        let new_user = user_val + plaintext_param;

        // Return: (status_code.reveal(), new_encrypted_global, new_encrypted_user)
        (
            0_u8.reveal(),
            global_ctxt.owner.from_arcis(new_global),
            user_ctxt.owner.from_arcis(new_user),
        )
    }
}
```

### Important Circuit Details

- **Status codes**: First return value is always `u8` status (0 = success)
- **Overflow checks**: Always check if `new_value < old_value` (underflow) or use `.saturating_*` ops
- **Randomness**: Use `ArcisRNG::gen_integer_from_width(8)` for random bytes, `ArcisRNG::bool()` for booleans
- **Rejection sampling**: When generating randoms in range, use rejection sampling to avoid modulo bias (see `transfer` circuit lines 139-179)
- **Context preservation**: Return new encrypted values with `.from_arcis()` using original context's owner

### Status Code Conventions

- `0` - Success
- `1` - Math Overflow/Underflow
- `2` - Insufficient Funds
- `3` - RNG Failure
- Add new codes as needed per instruction

## Transfer Mechanics Deep Dive

The transfer instruction (`encrypted-ixs/src/lib.rs:116`) is the most complex feature:

### Cost Calculation Steps

1. **Variance Roll** (lines 139-179)
   - Rejection sample random 0 to `max_variance`
   - Apply variance: `±(transfer_amount × variance_roll / 255)`
   - Random boolean determines +/-

2. **Fee Calculation** (lines 193-194)
   - Fee in bps: `255 - max_variance`
   - Higher variance = lower fee (incentive for privacy)

3. **NAV Adjustment** (lines 198-218)
   - Calculate `NAV% = (global_dc_balance / global_reserves) × 100`
   - NAV < 100%: Discount sender (excess reserves)
   - NAV > 100%: Penalize sender (insufficient reserves)

4. **Socialized Difference** (lines 243-253)
   - `delta = sender_charge - transfer_amount`
   - Positive delta → burn DC (social win)
   - Negative delta → mint DC (social loss)

### Safety Checks

- **Pre-flight**: Worst-case charge must not exceed sender balance (line 225)
- **Receiver overflow**: Check `receiver + amount >= receiver` (line 229)
- **Sender cap**: If actual cost > balance, zero sender balance (no revert, line 234)

## Development Patterns

### Adding New Encrypted Instructions

1. **Add circuit to `encrypted-ixs/src/lib.rs`**:
   ```rust
   #[instruction]
   pub fn my_new_instruction(...) -> (...) { ... }
   ```

2. **Create module in `programs/degen_cash/src/products/{product}/`**:
   - Define `init_my_new_instruction_comp_def` with `COMP_DEF_OFFSET`
   - Define `queue_my_new_instruction` with `#[queue_computation_accounts]`
   - Define `my_new_instruction_callback` with `#[arcium_callback]`

3. **Wire up in `programs/degen_cash/src/lib.rs`**:
   ```rust
   pub fn init_my_new_instruction_comp_def(ctx: Context<...>) -> Result<()> { ... }
   pub fn queue_my_new_instruction(ctx: Context<...>, ...) -> Result<()> { ... }
   #[arcium_callback(encrypted_ix = "my_new_instruction")]
   pub fn my_new_instruction_callback(ctx: Context<...>, output: ...) -> Result<()> { ... }
   ```

4. **Add tests in `tests/degen_cash.ts`**:
   - Test all 3 steps
   - Await callback event
   - Decrypt and verify balances

### Testing Encrypted Balances

Always decrypt balances after operations to verify correctness:

```typescript
const dcAccount = await program.account.dcUserTokenAccount.fetch(user.dcTokenAccount);
const sharedSecret = x25519.getSharedSecret(user.x25519PrivateKey, mxePublicKey);
const cipher = new RescueCipher(sharedSecret);
const nonceBytes = new anchor.BN(dcAccount.amountNonce.toString()).toArrayLike(Buffer, "le", 16);
const decryptedBalance = cipher.decrypt([dcAccount.amount], nonceBytes);
```

## Circuit Compilation and Serving

- Circuits in `encrypted-ixs/` compile to `.arcis` files
- Served via URL in `CIRCUITS_URL` constant (see `consts.rs`)
- `arcium test` handles compilation and serving automatically
- For production: Upload `.arcis` files to public URL, update `CIRCUITS_URL`

## Important Constants

**`programs/degen_cash/src/products/base/consts.rs`**:
- `DC_GLOBAL_MINT_SEED` - PDA seed for global mint
- `DC_USER_TOKEN_ACCOUNT_SEED` - PDA seed for user accounts
- `CIRCUITS_URL` - Base URL for `.arcis` circuit files
- `COMP_DEF_OFFSET_*` - Computation definition offsets per instruction

## Key Dependencies

- `@arcium-hq/client` (v0.3.0) - TypeScript client for Arcium MPC
- `anchor-lang`, `arcium-anchor` - Solana program frameworks
- `tweetnacl` - x25519 key derivation for Shared context decryption
- `arcis_imports` - Rust imports for encrypted circuits

## Common Pitfalls

1. **Forgetting to start Docker** - `arcium test` requires Docker for MPC nodes
2. **Not syncing keys** - Run `arcium keys sync` once before first test
3. **Modulo bias in RNG** - Always use rejection sampling for bounded randoms
4. **Overflow in encrypted math** - Check underflow/overflow on all arithmetic
5. **Context mismatch** - Return encrypted values with correct context owner (`.from_arcis()`)
6. **Missing status checks** - Always check callback status codes in tests

## Status Codes Reference

| Code | Meaning | Used In |
|------|---------|---------|
| 0 | Success | All instructions |
| 1 | Math Overflow/Underflow | deposit, withdraw, transfer |
| 2 | Insufficient Funds | withdraw, transfer |
| 3 | RNG Failure | transfer |

## Privacy Considerations

- **NAV is never revealed** - Stored in `Enc<Mxe, u64>`, inaccessible to users
- **Transfer costs are obfuscated** - Variance + randomness hides true cost
- **Balances are encrypted** - Only user with x25519 key can decrypt their balance
- **Socialized variance** - No one knows if system is minting or burning DC on each transfer
