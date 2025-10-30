# Degen Cash

A suite of experimental Solana programs leveraging [Arcium](https://arcium.com/) encrypted computation for privacy-preserving financial products featuring **socialized wins and losses**.

## Table of Contents
- [Overview](#overview)
- [Core Concept](#core-concept)
- [Architecture](#architecture)
- [Products](#products)
  - [Degen Base](#degen-base)
  - [Degen Escrow](#degen-escrow-coming-soon)
  - [Degen Lottery](#degen-lottery-coming-soon)
- [Code Structure](#code-structure)
- [Testing](#testing)

---

## Overview

Degen Cash (DC) is a privacy-focused financial system built on Solana using Arcium's encrypted computation framework. The core innovation is an **encrypted and unknown peg ratio** between DC tokens and USDC reserves, with the system automatically minting and burning DC through user transactions to maintain balance.

**Key Features:**
- Encrypted global state using Arcium Multi-Party Computation (MPC)
- Unknown DC-to-USDC peg ratio (NAV) stored in encrypted context
- Socialized gains/losses distributed across all DC holders
- Privacy-preserving transfers with configurable variance and randomness
- Multiple financial products built on the same encrypted state

---

## Core Concept

### Encrypted NAV (Net Asset Value)

The system maintains an encrypted peg ratio between DC and USDC reserves:

```
NAV% = (Total DC Supply / USDC Reserves) × 100
```

This ratio is **never revealed** to users and is stored in Arcium's MPC context (`Enc<Mxe, u64>`), ensuring:
- Users cannot know the true value of their DC holdings
- The system can obfuscate value transfers through randomness
- Privacy is maintained through encrypted computation

### Socialized Wins & Losses

Every transaction creates variance between what senders pay and what receivers get:

- **Social Win (Individual Loss)**: Sender pays more than receiver gets → DC is burned, benefiting all holders
- **Social Loss (Individual Win)**: Sender pays less than receiver gets → DC is minted, diluting all holders

This mechanism distributes transaction costs and gains across the entire ecosystem while maintaining privacy.

---

## Architecture

### Arcium Encryption Contexts

The system uses two types of encrypted contexts:

1. **`Enc<Mxe, u64>`** - Multi-Party Execution Context
   - Stores the global DC mint amount (total supply)
   - Accessible only through Arcium MPC nodes
   - Represents system-wide encrypted state
   - Used for: Global DC supply tracking

2. **`Enc<Shared, u64>`** - User Shared Context
   - Stores individual user DC balances
   - Encrypted but accessible to the specific user
   - Privacy-preserving per-user state
   - Used for: User account balances

### Technology Stack

- **Solana**: Layer 1 blockchain
- **Anchor**: Solana program framework
- **Arcium**: Encrypted computation and MPC network
- **Rust**: Smart contract implementation language

---

## Products

### Degen Base

**Status:** ✅ Complete

The foundational product enabling private DC token management with variance-based transfers.

#### Features

- ✅ Initialize Global DC Mint
- ✅ Create DC Token Accounts
- ✅ Deposit USDC → Mint DC
- ✅ Transfer DC with variance
- ✅ Withdraw DC → Burn for USDC
- ✅ Check Balance (client-side only)

#### Transfer Mechanics

The transfer function enables **private, obfuscated value transfers** with dynamic pricing based on variance selection and system health.

##### Core Guarantees

1. **Receiver Guarantee**: Always receives exactly `transfer_amount`
2. **Sender Variance**: Chooses `max_variance` (0-255) determining:
   - Maximum cost uncertainty (higher = more variance)
   - Fee rate: `(255 - max_variance)` basis points
   - Example: `max_variance=0` → 255 bps (2.55%) fee
   - Example: `max_variance=255` → 0 bps fee

##### Cost Calculation Process

**Step 1: Random Cost Adjustment**
- System samples random number (0 to `max_variance`)
- Random boolean determines direction (+/-)
- If TRUE: `sender_cost = transfer_amount - (transfer_amount × variance_roll / 255)`
- If FALSE: `sender_cost = transfer_amount + (transfer_amount × variance_roll / 255)`

**Step 2: NAV-Based Adjustment**
- `NAV% = (DC Supply / USDC Reserves) × 100`
- If NAV < 100%: Sender gets discount of `(100 - NAV%)` basis points
- If NAV > 100%: Sender pays penalty of `NAV%` basis points

**Step 3: Socialized Difference**
- Difference between sender cost and receiver amount adjusts global DC supply
- `sender_cost < transfer_amount` → DC minted (social loss)
- `sender_cost > transfer_amount` → DC burned (social win)

##### Safety Mechanisms

- Pre-flight check: Sender must cover worst-case `transfer_amount + max_variance + fee`
- If actual cost > balance: Sender balance zeroed (no revert)
- Overflow protection on receiver balance
- Rejection sampling for secure randomness (max 10 attempts)

##### Status Codes

- `0`: Success
- `1`: Math Overflow
- `2`: Insufficient Funds (worst-case check failed)
- `3`: RNG Failure (couldn't generate valid random in 10 attempts)

##### Privacy & Obfuscation

The variance mechanism serves multiple purposes:
- **Value Obfuscation**: True transfer costs are unknown to observers
- **Privacy Incentive**: Users can pay fees via variance uncertainty instead of fixed costs
- **Network Effect**: Higher variance → lower fees, but more unpredictability

---

### Degen Escrow (Coming Soon)

**Status:** 🚧 Planned

A time-locked escrow system with multi-party release conditions and burn mechanics.

#### Planned Features

- **Create Escrow**: Lock DC with configurable timer and release conditions
- **Multi-Party Release**: Define required parties who must approve release
- **Conditional Unlock**: Release funds to specific user if threshold met
- **Burn on Timeout**: If timer expires without release, funds are burned (social win)

#### Use Cases

- Conditional payments and agreements
- Multi-signature treasury management
- Dead man's switch mechanisms
- Social penalty for failed agreements

---

### Degen Lottery (Coming Soon)

**Status:** 🚧 Planned

A provably fair lottery system where ticket sales are burned and winners claim from a fixed prize pool.

#### Planned Mechanics

**Setup:**
- Admin creates lottery: 500 tickets @ $10 each = $5,000 collected
- All collected DC is **immediately burned** (social win)
- Prize pool set to $5,000 (separate from burned DC)

**Daily Drawing:**
- 5 random tickets selected on-chain
- Winner options:
  - Hold all 5 winning tickets → Claim full $5,000
  - Hold 1+ winning tickets → Redeem each for $20

#### Deflationary Design

- Ticket sales burn DC (reduces supply)
- Prize pool is fixed and separate from burned DC
- Net effect: More DC burned than minted, benefiting all holders

---

## Code Structure

```
degen_cash/
├── programs/
│   └── degen_cash/
│       └── src/
│           ├── lib.rs                    # Main Anchor program entry
│           └── products/
│               ├── mod.rs
│               ├── base/                 # Base product (complete)
│               │   ├── mod.rs
│               │   ├── consts.rs
│               │   ├── state.rs
│               │   ├── error.rs
│               │   ├── init.rs           # Initialize global DC mint
│               │   ├── create_dc_token_account.rs
│               │   ├── deposit.rs        # USDC → DC minting
│               │   ├── transfer.rs       # Variance-based transfers
│               │   └── withdraw.rs       # DC → USDC burning
│               ├── escrow/               # Escrow product (planned)
│               │   └── mod.rs
│               └── lotto/                # Lottery product (planned)
│                   └── mod.rs
│
├── encrypted-ixs/
│   └── src/
│       └── lib.rs                        # Arcium encrypted instruction circuits
│                                         # Contains encrypted computation logic for:
│                                         # - init_global_dc_mint
│                                         # - init_user_dc_balance
│                                         # - deposit, withdraw, transfer
│
├── tests/
│   └── degen_cash.ts                     # Anchor/TypeScript test suite
│
├── app/                                  # Frontend (in development)
│   └── ...                               # Web UI for interacting with DC programs
│
├── Anchor.toml                           # Anchor configuration
├── Arcium.toml                           # Arcium MPC network configuration
└── Cargo.toml                            # Rust workspace configuration
```

### Key Directories

**`programs/degen_cash/src/`**
- Main Solana program logic
- Handles account validation, instruction dispatching
- Integrates with Arcium encrypted circuits

**`encrypted-ixs/src/`**
- Arcium encrypted computation circuits
- Implements secure MPC operations on encrypted state
- All sensitive balance and supply calculations happen here

**`tests/`**
- End-to-end test suite
- Tests all product features against local Arcium network
- Validates encrypted state transitions

**`app/`**
- Frontend application (in progress)
- User interface for depositing, transferring, and withdrawing DC

---

## Testing

### Prerequisites

1. **Docker**: Must be running for Arcium local network
2. **Arcium CLI**: Install from [Arcium docs](https://docs.arcium.com)
3. **Anchor CLI**: Version compatible with Solana programs
4. **Rust Toolchain**: As specified in `rust-toolchain`

### Running Tests

#### 1. Sync Arcium Keys (First Time Only)

```bash
arcium keys sync
```

This syncs the MPC node keys to your local device for encrypted computation.

#### 2. Run Test Suite

```bash
arcium test
```

This command:
- Starts a local Arcium MPC network (via Docker)
- Spins up a Solana test validator with Arcium program deployed
- Runs the full test suite in `tests/degen_cash.ts`
- Tests all encrypted instructions (deposit, transfer, withdraw)

#### Test Coverage

The `degen_cash.ts` test suite validates:
- ✅ Global DC mint initialization
- ✅ User DC account creation
- ✅ USDC deposits and DC minting
- ✅ Variance-based transfers with randomness
- ✅ Withdrawals and DC burning
- ✅ Balance tracking and consistency
- ✅ Encrypted state transitions
- ✅ Status code handling

---

## Contributing

This is an experimental project exploring privacy-preserving DeFi primitives. Contributions, ideas, and feedback are welcome!

---

## License

[Specify License]

---

## Disclaimer

This software is experimental and unaudited. Use at your own risk. The encrypted NAV mechanism and variance-based transfers introduce unpredictable costs and potential losses. Not financial advice.