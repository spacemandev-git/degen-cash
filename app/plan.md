# Degen Cash App Development Plan

## Project Overview
Mobile-friendly Svelte 5 demo app for Degen Cash - a privacy-preserving Solana token system using Arcium MPC encryption. Users can deposit USDC, transfer DC tokens with configurable variance, and withdraw back to USDC.

**Design Reference**: https://www.figma.com/design/32mMZ3v91d1cVZwpkoRSqC/Degen-Cash?node-id=0-1
**Test Reference**: `tests/degen_cash.ts`

---

## Tech Stack
- **Frontend**: SvelteKit 5 (mobile-first responsive)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Blockchain**: Solana + Anchor + Arcium MPC
- **Styling**: TailwindCSS (inferred from Figma - dark theme)
- **State Management**: Svelte stores
- **Notifications**: svelte-sonner (toast library)

---

## 📊 Development Progress Tracker

**Last Updated**: 2025-10-30

### Completed Phases ✅

- ✅ **Phase 0: Infrastructure Setup** (5/5 tasks) - COMPLETE
  - Dependencies installed (using bun)
  - Environment configuration with RPC proxy
  - Dexie database schema
  - Circuits serving route (`/circuits/*`)
  - Artifact copy script

- ✅ **Phase 1: Setup Scripts** (2/2 tasks) - COMPLETE
  - Setup script for localnet/devnet
  - Package.json commands

- ✅ **Phase 2: Core Wallet Management** (3/3 tasks) - COMPLETE
  - Wallet service (create/import with funny names)
  - Anchor program service
  - Balance decryption service

- ✅ **Phase 3: Onboarding Flow** (2/2 tasks) - COMPLETE
  - Onboarding screen (create/import wallets)
  - Route guard (auto-redirect to onboarding)

- ✅ **Phase 4: Home Screen** (4/4 tasks) - COMPLETE
  - Wallet stores (reactive state)
  - Balance fetching service (with auto-polling)
  - Airdrop service (SOL + USDC)
  - Home screen component (balances + action buttons)

### In Progress 🚧

- ⏳ **Phase 5: DC Account Creation** (0/1 tasks)
- ⏳ **Phase 6: Deposit Flow** (0/2 tasks)
- ⏳ **Phase 7: Withdraw Flow** (0/2 tasks)
- ⏳ **Phase 8: Transfer (Send) Flow** (0/2 tasks)
- ⏳ **Phase 9: Receive Flow** (0/1 tasks)
- ⏳ **Phase 10: Wallet Management** (0/2 tasks)
- ⏳ **Phase 11: Polish & Testing** (0/4 tasks)
- ⏳ **Phase 12: Documentation & Deployment** (0/2 tasks)

### Overall Status

**Progress**: 16/40 tasks complete (40%)

**Key Achievements**:
- ✨ Fully functional onboarding with embedded wallet creation
- ✨ Home screen with real-time balance updates
- ✨ Backend RPC proxy for security
- ✨ Self-hosted circuit serving
- ✨ Airdrop functionality for testing
- ✨ Beautiful dark theme UI matching Figma design

**Next Milestone**: Complete DC account creation flow (Phase 5) to enable deposits/transfers/withdrawals

---

## Phase 0: Infrastructure Setup ✅ COMPLETE

### Task 0.1: Project Dependencies
**Files**: `app/package.json`

Install required dependencies:
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token @arcium-hq/client
npm install dexie tweetnacl @noble/curves
npm install unique-names-generator
npm install svelte-sonner
npm install -D @tailwindcss/typography
```

**Dependencies Explanation**:
- `@coral-xyz/anchor`: Solana program interaction (see `tests/degen_cash.ts:1-3`)
- `@arcium-hq/client`: Arcium MPC utilities for encryption (see `tests/degen_cash.ts:5-19`)
- `dexie`: IndexedDB management for embedded wallets
- `tweetnacl`: x25519 key derivation (see `tests/degen_cash.ts:163-166`)
- `@noble/curves`: Alternative crypto library for x25519
- `unique-names-generator`: Random wallet names
- `svelte-sonner`: Toast notifications

**Acceptance Criteria**:
- All packages installed
- `npm run dev` starts without errors

---

### Task 0.2: Environment Configuration
**Files**: `app/.env.example`, `app/.env`

Create environment variables structure:
```env
# RPC Configuration (backend secret)
PRIVATE_SOLANA_RPC_URL=http://127.0.0.1:8899

# Program IDs (set by anchor build)
PUBLIC_DEGEN_CASH_PROGRAM_ID=<set_after_deploy>
PUBLIC_ARCIUM_CLUSTER_PUBKEY=<set_by_setup_script>

# Network
PUBLIC_NETWORK=localhost  # or devnet
```

**Backend RPC Access**:
Create `app/src/routes/api/rpc/+server.ts`:
```typescript
import { PRIVATE_SOLANA_RPC_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const body = await request.json();
  const response = await fetch(PRIVATE_SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return json(await response.json());
}
```

**Acceptance Criteria**:
- `.env` file created with placeholders
- Backend RPC proxy endpoint working
- Frontend can call `/api/rpc` to interact with Solana

---

### Task 0.3: Database Schema (Dexie)
**Files**: `app/src/lib/db/schema.ts`

Define IndexedDB schema using Dexie:
```typescript
import Dexie, { type Table } from 'dexie';
import type { Keypair } from '@solana/web3.js';

export interface Wallet {
  id?: number;
  name: string;           // Random generated name
  publicKey: string;      // Base58 encoded
  secretKey: Uint8Array;  // Full keypair secret
  x25519PrivateKey: Uint8Array;  // For decryption (see tests/degen_cash.ts:165)
  x25519PublicKey: Uint8Array;   // For shared secret
  createdAt: Date;
  isActive: boolean;      // Current active wallet
}

export interface TransferHistory {
  id?: number;
  walletPublicKey: string;
  recipientPublicKey: string;
  recipientName?: string; // If known
  amount: number;         // DC amount (6 decimals)
  variance: number;       // 0-255
  timestamp: Date;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface KnownAddress {
  id?: number;
  publicKey: string;
  name: string;          // User-set or generated
  lastUsed: Date;
}

export class DegenCashDB extends Dexie {
  wallets!: Table<Wallet>;
  transferHistory!: Table<TransferHistory>;
  knownAddresses!: Table<KnownAddress>;

  constructor() {
    super('DegenCashDB');
    this.version(1).stores({
      wallets: '++id, publicKey, isActive',
      transferHistory: '++id, walletPublicKey, timestamp',
      knownAddresses: '++id, publicKey, lastUsed'
    });
  }
}

export const db = new DegenCashDB();
```

**Reference**: Test file derives x25519 keys at `tests/degen_cash.ts:163-166`

**Acceptance Criteria**:
- Dexie database initialized
- Can open browser DevTools > Application > IndexedDB and see `DegenCashDB`

---

### Task 0.4: Circuits Serving Route
**Files**: `app/src/routes/circuits/[filename]/+server.ts`

Create a SvelteKit route to serve compiled Arcium circuits from the app domain:

**Why**: The Rust program's `CIRCUITS_URL` constant needs to point to a URL where `.arcis` files are hosted. Instead of using a separate server (like `serve_circuits.sh`), the app can serve its own circuits.

**Implementation**:
- Create dynamic route: `/circuits/[filename].arcis`
- Serves files from `../build/` directory
- Security: Only allows `.arcis` files, prevents directory traversal
- Caching: Sets `Cache-Control` headers for performance

**Example URLs**:
- `http://localhost:5173/circuits/deposit_testnet.arcis`
- `http://localhost:5173/circuits/transfer_testnet.arcis`
- `http://localhost:5173/circuits/withdraw_testnet.arcis`

**Environment Variable**:
Add to `.env`:
```env
PUBLIC_CIRCUITS_BASE_URL=http://localhost:5173/circuits/
```

**For Production Deployment**:
Before deploying, update the Rust program's `CIRCUITS_URL`:
```rust
// programs/degen_cash/src/products/base/consts.rs
pub const CIRCUITS_URL: &str = "https://your-app-domain.com/circuits/";
```

Then rebuild and redeploy the program:
```bash
anchor build
anchor deploy
```

**Acceptance Criteria**:
- Route serves `.arcis` files correctly
- Can access circuits via `http://localhost:5173/circuits/deposit_testnet.arcis`
- Security checks prevent directory traversal
- Files cached for 1 hour

---

### Task 0.5: Copy Anchor Artifacts Script
**Files**: `scripts/copy-artifacts.sh`, `app/src/lib/anchor/`

Create a script to copy Anchor build artifacts from `target/` to `app/src/lib/anchor/`:

**Why**: The app needs access to the program's IDL and TypeScript types to interact with the on-chain program. After building with `anchor build`, these artifacts must be copied to the app directory.

**What Gets Copied**:

1. **IDL** (`target/idl/degen_cash.json` → `app/src/lib/anchor/idl/`)
   - Interface definition for the program
   - Used by Anchor client to call program methods
   - Safe to commit to git

2. **Types** (`target/types/degen_cash.ts` → `app/src/lib/anchor/types/`)
   - TypeScript type definitions
   - Provides type safety and autocomplete
   - Safe to commit to git

3. **Deployment Keypair** (`target/deploy/degen_cash-keypair.json` → `app/src/lib/anchor/deploy/`)
   - Program's deployment keypair (program ID)
   - **MUST NOT** be committed (contains secret key)
   - Protected by `.gitignore`

**Script Usage**:
```bash
# From project root
anchor build
bun run copy-artifacts
```

**Package.json Script**:
```json
{
  "scripts": {
    "copy-artifacts": "bash scripts/copy-artifacts.sh"
  }
}
```

**Security**:
Add to `app/.gitignore`:
```gitignore
# Anchor artifacts (protect deployment keypairs)
/src/lib/anchor/deploy/
```

**When to Run**:
- After first `anchor build`
- After modifying program interface (new instructions, accounts)
- After deploying new program version

**Acceptance Criteria**:
- Script copies all 3 artifact types
- Script is idempotent (can be run multiple times safely)
- Deployment keypair directory is gitignored
- Script warns about security if keypair is copied
- README.md created in `app/src/lib/anchor/` documenting usage

---

## Phase 1: Setup Scripts (Localnet/Devnet) ✅ COMPLETE

### Task 1.1: Setup Script - Computation Definitions
**Files**: `scripts/setup.ts`

Create a Node script that initializes all computation definitions (similar to `tests/degen_cash.ts:122-132`):

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DegenCash } from "../target/types/degen_cash";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import {
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  getMXEAccAddress,
} from "@arcium-hq/client";

// Steps (reference tests/degen_cash.ts:104-216):
// 1. Load owner keypair from file (or generate if localnet)
// 2. Create fake USDC mint (6 decimals) - tests/degen_cash.ts:111-119
// 3. Initialize all comp defs - tests/degen_cash.ts:122-132
//    - initGlobalDCMintCompDef
//    - initDepositCompDef
//    - initCreateDcTokenAccountCompDef
//    - initTransferCompDef
//    - initWithdrawCompDef
// 4. Initialize global DC mint - tests/degen_cash.ts:187-216
// 5. Save output to .env file:
//    - PUBLIC_ARCIUM_CLUSTER_PUBKEY
//    - PUBLIC_DEPOSIT_MINT (fake USDC)
//    - PUBLIC_DEGEN_CASH_PROGRAM_ID

async function setup(network: 'localhost' | 'devnet', keypairPath?: string) {
  // Implementation
}
```

**Script Usage**:
```bash
# Localnet (generates new keypair)
npm run setup:localnet

# Devnet (uses provided keypair)
npm run setup:devnet -- --keypair ~/.config/solana/devnet.json
```

**Acceptance Criteria**:
- Script creates fake USDC mint
- All 5 comp defs initialized successfully
- Global DC mint initialized
- Output written to `.env`
- Can be re-run safely (idempotent checks)

---

### Task 1.2: Setup Script - Package.json Commands
**Files**: `app/package.json`, `scripts/package.json`

Add npm scripts:
```json
{
  "scripts": {
    "setup:localnet": "tsx scripts/setup.ts --network localhost",
    "setup:devnet": "tsx scripts/setup.ts --network devnet"
  }
}
```

Install `tsx` for TypeScript execution:
```bash
npm install -D tsx
```

**Acceptance Criteria**:
- `npm run setup:localnet` completes successfully
- `.env` file populated with required variables

---

## Phase 2: Core Wallet Management ✅ COMPLETE

### Task 2.1: Wallet Service
**Files**: `app/src/lib/services/wallet.ts`

Create wallet management service:
```typescript
import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { x25519 } from '@arcium-hq/client';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { db, type Wallet } from '$lib/db/schema';

export class WalletService {
  /**
   * Create new wallet with random name
   * Reference: tests/degen_cash.ts:137-180
   */
  static async createWallet(): Promise<Wallet> {
    const keypair = Keypair.generate();
    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      style: 'capital'
    });

    // Derive x25519 keys (see tests/degen_cash.ts:163-166)
    const message = Buffer.from('dgn.cash');
    const signature = nacl.sign.detached(message, keypair.secretKey);
    const x25519PrivateKey = signature.slice(0, 32);
    const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

    const wallet: Wallet = {
      name,
      publicKey: keypair.publicKey.toBase58(),
      secretKey: keypair.secretKey,
      x25519PrivateKey,
      x25519PublicKey,
      createdAt: new Date(),
      isActive: true
    };

    // Deactivate other wallets
    await db.wallets.where('isActive').equals(true).modify({ isActive: false });

    await db.wallets.add(wallet);
    return wallet;
  }

  /**
   * Import wallet from secret key
   */
  static async importWallet(secretKey: Uint8Array, name?: string): Promise<Wallet> {
    // Similar to createWallet but uses provided secret
  }

  /**
   * Get active wallet
   */
  static async getActiveWallet(): Promise<Wallet | undefined> {
    return await db.wallets.where('isActive').equals(true).first();
  }

  /**
   * Switch active wallet
   */
  static async setActiveWallet(publicKey: string): Promise<void> {
    await db.wallets.where('isActive').equals(true).modify({ isActive: false });
    await db.wallets.where('publicKey').equals(publicKey).modify({ isActive: true });
  }

  /**
   * Get all wallets
   */
  static async getAllWallets(): Promise<Wallet[]> {
    return await db.wallets.toArray();
  }
}
```

**Acceptance Criteria**:
- Can create wallet with funny name (e.g., "Brave Penguin")
- x25519 keys derived correctly
- Can import wallet from secret key
- Only one wallet active at a time

---

### Task 2.2: Anchor Program Service
**Files**: `app/src/lib/services/program.ts`

Create service to interact with Anchor program:
```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { DegenCash } from '../../../target/types/degen_cash';
import idl from '../../../target/idl/degen_cash.json';

export class ProgramService {
  private connection: Connection;
  private program: Program<DegenCash>;

  constructor(rpcUrl: string, programId: string) {
    // Use backend RPC proxy
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Create a dummy wallet for provider (actual wallet comes per-transaction)
    const dummyWallet = {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs
    };

    const provider = new AnchorProvider(
      this.connection,
      dummyWallet as any,
      { commitment: 'confirmed' }
    );

    this.program = new Program(idl as DegenCash, programId, provider);
  }

  getProgram(): Program<DegenCash> {
    return this.program;
  }

  /**
   * Fetch DC user token account
   * Reference: tests/degen_cash.ts:168-171 for PDA derivation
   */
  async getDCTokenAccount(owner: PublicKey) {
    const [dcTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_user_token_account'), owner.toBuffer()],
      this.program.programId
    );

    try {
      return await this.program.account.dcUserTokenAccount.fetch(dcTokenAccount);
    } catch {
      return null; // Account doesn't exist
    }
  }

  /**
   * Check if DC account exists
   */
  async dcAccountExists(owner: PublicKey): Promise<boolean> {
    return (await this.getDCTokenAccount(owner)) !== null;
  }
}
```

**Acceptance Criteria**:
- Can initialize program with IDL
- Can fetch DC token accounts
- Handles non-existent accounts gracefully

---

### Task 2.3: Balance Decryption Service
**Files**: `app/src/lib/services/balance.ts`

Create service to decrypt encrypted balances:
```typescript
import * as anchor from '@coral-xyz/anchor';
import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client';
import type { AnchorProvider } from '@coral-xyz/anchor';

export class BalanceService {
  /**
   * Decrypt DC balance
   * Reference: tests/degen_cash.ts:90-97
   */
  static async getDecryptedBalance(
    dcAccount: any,
    userX25519PrivateKey: Uint8Array,
    mxePublicKey: Uint8Array
  ): Promise<string> {
    const sharedSecret = x25519.getSharedSecret(userX25519PrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);
    const nonceBytes = new anchor.BN(dcAccount.amountNonce.toString()).toArrayLike(
      Buffer,
      'le',
      16
    );
    const decryptedBalance = cipher.decrypt([dcAccount.amount], nonceBytes);
    return decryptedBalance.toString();
  }

  /**
   * Format balance for display (convert from 6 decimals)
   */
  static formatBalance(balance: string, decimals = 6): string {
    const num = Number(balance) / Math.pow(10, decimals);
    return num.toFixed(2);
  }
}
```

**Acceptance Criteria**:
- Can decrypt encrypted balances correctly
- Matches test implementation (`tests/degen_cash.ts:90-97`)

---

## Phase 3: Onboarding Flow ✅ COMPLETE

### Task 3.1: Onboarding Screen Component
**Files**: `app/src/routes/onboarding/+page.svelte`

Create onboarding screen (reference Figma "Onboarding" section):
- Logo/branding at top
- "Create New Wallet" button
- "Import Wallet" button (shows textarea for secret key)
- Auto-navigate to home after wallet creation

**Component Structure**:
```svelte
<script lang="ts">
  import { WalletService } from '$lib/services/wallet';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  let importing = false;
  let secretKeyInput = '';

  async function createWallet() {
    try {
      const wallet = await WalletService.createWallet();
      toast.success(`Wallet created: ${wallet.name}`);
      goto('/');
    } catch (error) {
      toast.error('Failed to create wallet');
    }
  }

  async function importWallet() {
    // Parse secretKeyInput and call WalletService.importWallet
  }
</script>

<!-- UI matching Figma design -->
```

**Styling Notes** (from Figma):
- Dark background (#1a1a2e or similar)
- Purple/blue gradient accents
- Large centered logo
- Mobile-first (max-width: 400px)

**Acceptance Criteria**:
- Can create wallet with random name
- Can import wallet from JSON array secret key
- Redirects to home after wallet creation
- Matches Figma design aesthetics

---

### Task 3.2: Onboarding Route Guard
**Files**: `app/src/routes/+layout.svelte`

Add route guard to redirect to onboarding if no wallet:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { WalletService } from '$lib/services/wallet';
  import { Toaster } from 'svelte-sonner';

  onMount(async () => {
    const wallet = await WalletService.getActiveWallet();
    if (!wallet && $page.url.pathname !== '/onboarding') {
      goto('/onboarding');
    }
  });
</script>

<Toaster position="top-center" />
<slot />
```

**Acceptance Criteria**:
- First-time users redirected to `/onboarding`
- Users with wallets can access home

---

## Phase 4: Home Screen ✅ COMPLETE

### Task 4.1: Wallet Store (Reactive State)
**Files**: `app/src/lib/stores/wallet.ts`

Create Svelte store for active wallet and balance:
```typescript
import { writable, derived } from 'svelte/store';
import type { Wallet } from '$lib/db/schema';

export const activeWallet = writable<Wallet | null>(null);
export const dcBalance = writable<string>('0');
export const usdcBalance = writable<string>('0');
export const isLoading = writable<boolean>(false);

// Derived formatted balances
export const formattedDCBalance = derived(dcBalance, ($balance) => {
  return (Number($balance) / 1_000_000).toFixed(2);
});

export const formattedUSDCBalance = derived(usdcBalance, ($balance) => {
  return (Number($balance) / 1_000_000).toFixed(2);
});
```

**Acceptance Criteria**:
- Stores update reactively across components
- Formatted balances display correctly

---

### Task 4.2: Balance Fetching Service
**Files**: `app/src/lib/services/balances.ts`

Create service to fetch and update balances:
```typescript
import { get } from 'svelte/store';
import { activeWallet, dcBalance, usdcBalance } from '$lib/stores/wallet';
import { ProgramService } from './program';
import { BalanceService } from './balance';
import { getAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { getMXEPublicKey } from '@arcium-hq/client';

export class BalanceFetchService {
  private programService: ProgramService;
  private mxePublicKey: Uint8Array | null = null;

  constructor(programService: ProgramService) {
    this.programService = programService;
  }

  async initialize() {
    // Fetch MXE public key (tests/degen_cash.ts:182-185)
    const provider = this.programService.getProgram().provider as any;
    this.mxePublicKey = await getMXEPublicKey(
      provider,
      this.programService.getProgram().programId
    );
  }

  /**
   * Fetch DC balance (encrypted, then decrypt)
   */
  async fetchDCBalance(): Promise<void> {
    const wallet = get(activeWallet);
    if (!wallet || !this.mxePublicKey) return;

    const dcAccount = await this.programService.getDCTokenAccount(
      new PublicKey(wallet.publicKey)
    );

    if (dcAccount) {
      const decrypted = await BalanceService.getDecryptedBalance(
        dcAccount,
        wallet.x25519PrivateKey,
        this.mxePublicKey
      );
      dcBalance.set(decrypted);
    } else {
      dcBalance.set('0');
    }
  }

  /**
   * Fetch USDC balance from SPL token account
   * Reference: tests/degen_cash.ts:99-102
   */
  async fetchUSDCBalance(): Promise<void> {
    const wallet = get(activeWallet);
    if (!wallet) return;

    try {
      const connection = this.programService.getProgram().provider.connection;
      const depositMint = new PublicKey(process.env.PUBLIC_DEPOSIT_MINT!);

      // Get ATA (associated token account)
      const ata = await getAssociatedTokenAddress(
        depositMint,
        new PublicKey(wallet.publicKey)
      );

      const account = await getAccount(connection, ata);
      usdcBalance.set(account.amount.toString());
    } catch {
      usdcBalance.set('0');
    }
  }

  /**
   * Fetch all balances
   */
  async fetchAllBalances(): Promise<void> {
    await Promise.all([
      this.fetchDCBalance(),
      this.fetchUSDCBalance()
    ]);
  }
}
```

**Acceptance Criteria**:
- DC balance decrypted correctly
- USDC balance fetched from SPL token account
- Stores updated reactively

---

### Task 4.3: Home Screen Component
**Files**: `app/src/routes/+page.svelte`

Create home screen (reference Figma "Home Screens" section):
- Wallet name at top with dropdown to switch wallets
- DC balance (large, centered)
- USDC balance (smaller, below DC)
- 4 action buttons:
  - Deposit
  - Withdraw
  - Send (Transfer)
  - Receive (show QR code)
- Airdrop buttons (if localhost):
  - "Airdrop SOL" (1 SOL)
  - "Airdrop USDC" (10,000 USDC)

**Component Structure**:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { activeWallet, formattedDCBalance, formattedUSDCBalance } from '$lib/stores/wallet';
  import { BalanceFetchService } from '$lib/services/balances';
  import { goto } from '$app/navigation';

  let balanceService: BalanceFetchService;

  onMount(async () => {
    // Initialize services
    // Fetch balances
    // Set up polling (every 5 seconds)
  });

  function handleDeposit() {
    goto('/deposit');
  }

  // ... other handlers
</script>

<div class="home-container">
  <!-- Wallet switcher -->
  <div class="wallet-header">
    <span>{$activeWallet?.name}</span>
    <!-- Dropdown to switch wallets -->
  </div>

  <!-- Balances -->
  <div class="balance-display">
    <div class="dc-balance">{$formattedDCBalance} DC</div>
    <div class="usdc-balance">{$formattedUSDCBalance} USDC</div>
  </div>

  <!-- Action buttons -->
  <div class="actions">
    <button on:click={handleDeposit}>Deposit</button>
    <button on:click={() => goto('/withdraw')}>Withdraw</button>
    <button on:click={() => goto('/send')}>Send</button>
    <button on:click={() => goto('/receive')}>Receive</button>
  </div>

  <!-- Airdrop buttons (localhost only) -->
  {#if PUBLIC_NETWORK === 'localhost'}
    <div class="airdrops">
      <button on:click={airdropSOL}>Airdrop 1 SOL</button>
      <button on:click={airdropUSDC}>Airdrop 10,000 USDC</button>
    </div>
  {/if}
</div>
```

**Styling** (from Figma):
- Dark background
- Large DC balance (48px font)
- Purple gradient button at bottom
- Action buttons in 2x2 grid

**Acceptance Criteria**:
- Displays correct balances
- Balances update every 5 seconds (polling)
- Can navigate to all action screens
- Airdrop buttons only on localhost

---

### Task 4.4: Airdrop Functions
**Files**: `app/src/lib/services/airdrop.ts`

Create airdrop service:
```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';

export class AirdropService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Airdrop SOL (localhost only)
   */
  async airdropSOL(publicKey: PublicKey, amount = 1): Promise<string> {
    const signature = await this.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * Airdrop fake USDC
   * Reference: tests/degen_cash.ts:147-161
   *
   * Note: Requires mint authority keypair (from setup script)
   * For demo, store mint authority in backend
   */
  async airdropUSDC(
    publicKey: PublicKey,
    amount = 10000,
    depositMint: PublicKey,
    mintAuthority: Keypair
  ): Promise<string> {
    const ata = await getOrCreateAssociatedTokenAccount(
      this.connection,
      mintAuthority, // Payer
      depositMint,
      publicKey
    );

    const signature = await mintTo(
      this.connection,
      mintAuthority,
      depositMint,
      ata.address,
      mintAuthority,
      amount * 1_000_000 // 6 decimals
    );

    return signature;
  }
}
```

**Backend Route**: `app/src/routes/api/airdrop-usdc/+server.ts`
```typescript
// Endpoint to mint USDC (keeps mint authority secret)
export async function POST({ request }) {
  // Check network is localhost/devnet
  // Load mint authority from env
  // Call airdropUSDC
  // Return signature
}
```

**Acceptance Criteria**:
- SOL airdrop works on localhost
- USDC airdrop works via backend endpoint
- Balances update after airdrop

---

## Phase 5: DC Account Creation Flow

### Task 5.1: DC Account Check Middleware
**Files**: `app/src/lib/services/account-check.ts`

Create service to check if user has DC account and create if needed:
```typescript
import { ProgramService } from './program';
import { PublicKey, Keypair } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import * as anchor from '@coral-xyz/anchor';
import {
  getArciumEnv,
  getCompDefAccOffset,
  getComputationAccAddress,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getCompDefAccAddress,
  deserializeLE
} from '@arcium-hq/client';

export class AccountCheckService {
  /**
   * Check if user has DC account, create if not
   * Reference: tests/degen_cash.ts:218-250
   */
  static async ensureDCAccount(
    programService: ProgramService,
    userKeypair: Keypair,
    x25519PublicKey: Uint8Array
  ): Promise<boolean> {
    const program = programService.getProgram();
    const exists = await programService.dcAccountExists(userKeypair.publicKey);

    if (exists) return true;

    // Create DC account (queue computation)
    const arciumEnv = getArciumEnv();
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');
    const nonce = randomBytes(16);

    await program.methods
      .queueCreateDcTokenAccount(
        computationOffset,
        Array.from(x25519PublicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accounts({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        payer: userKeypair.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset('init_user_dc_balance')).readUInt32LE()
        )
      })
      .signers([userKeypair])
      .rpc({ skipPreflight: false, commitment: 'confirmed' });

    // Poll for account creation (2-3 seconds)
    await this.pollForAccountCreation(programService, userKeypair.publicKey, 10);
    return true;
  }

  /**
   * Poll for account creation (max attempts)
   */
  private static async pollForAccountCreation(
    programService: ProgramService,
    publicKey: PublicKey,
    maxAttempts = 10
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const exists = await programService.dcAccountExists(publicKey);
      if (exists) return;
    }
    throw new Error('DC account creation timed out');
  }
}
```

**Usage**: Call before any deposit/transfer/withdraw operation

**Acceptance Criteria**:
- Creates DC account if not exists
- Polls until account confirmed
- Handles errors gracefully

---

## Phase 6: Deposit Flow

### Task 6.1: Deposit Screen Component
**Files**: `app/src/routes/deposit/+page.svelte`

Create deposit screen (reference Figma "Deposits" section):
- Amount input (number pad UI from Figma)
- Display current USDC balance
- "Deposit" button (disabled if amount > balance)
- Loading state during transaction + polling

**Component Structure**:
```svelte
<script lang="ts">
  import { activeWallet, usdcBalance, formattedUSDCBalance } from '$lib/stores/wallet';
  import { DepositService } from '$lib/services/deposit';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  let amount = '';
  let isLoading = false;

  $: isValid = amount && Number(amount) > 0 && Number(amount) * 1_000_000 <= Number($usdcBalance);

  async function handleDeposit() {
    if (!isValid) return;

    isLoading = true;
    try {
      // Call DepositService
      // Poll for completion
      toast.success('Deposit successful!');
      goto('/');
    } catch (error) {
      toast.error('Deposit failed');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="deposit-container">
  <div class="balance-info">
    <span>Available: {$formattedUSDCBalance} USDC</span>
  </div>

  <div class="amount-input">
    <input type="number" bind:value={amount} placeholder="0.00" />
    <span class="currency">USDC</span>
  </div>

  <!-- Number pad (optional, or use native keyboard) -->

  <button
    on:click={handleDeposit}
    disabled={!isValid || isLoading}
    class="deposit-button"
  >
    {isLoading ? 'Processing...' : 'Deposit'}
  </button>
</div>
```

**Styling** (from Figma):
- Large centered amount input
- Number pad below (mobile-friendly)
- Purple gradient button at bottom

**Acceptance Criteria**:
- Amount validated against USDC balance
- Loading state during transaction
- Success toast on completion
- Returns to home screen

---

### Task 6.2: Deposit Service
**Files**: `app/src/lib/services/deposit.ts`

Create deposit service:
```typescript
import { ProgramService } from './program';
import { Keypair, PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import * as anchor from '@coral-xyz/anchor';
import {
  getArciumEnv,
  getCompDefAccOffset,
  getComputationAccAddress,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getCompDefAccAddress,
} from '@arcium-hq/client';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class DepositService {
  /**
   * Deposit USDC → DC
   * Reference: tests/degen_cash.ts:276-299
   */
  static async deposit(
    programService: ProgramService,
    userKeypair: Keypair,
    amount: number, // In USDC (6 decimals)
    depositMint: PublicKey
  ): Promise<string> {
    const program = programService.getProgram();
    const arciumEnv = getArciumEnv();
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');

    const signature = await program.methods
      .queueDeposit(computationOffset, new anchor.BN(amount))
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        payer: userKeypair.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset('deposit')).readUInt32LE()
        ),
        depositMint: depositMint,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([userKeypair])
      .rpc({ skipPreflight: false, commitment: 'confirmed' });

    return signature;
  }

  /**
   * Poll for deposit completion
   * Check if balance increased
   */
  static async pollForCompletion(
    programService: ProgramService,
    userPublicKey: PublicKey,
    expectedIncrease: string,
    maxAttempts = 20
  ): Promise<boolean> {
    // Poll DC balance, wait for increase
    // Return true if confirmed within maxAttempts * 500ms
  }
}
```

**Acceptance Criteria**:
- Deposit transaction submits successfully
- Polling detects balance increase
- Error handling for insufficient USDC

---

## Phase 7: Withdraw Flow

### Task 7.1: Withdraw Screen Component
**Files**: `app/src/routes/withdraw/+page.svelte`

Create withdraw screen (reference Figma "withdrawals" section):
- Amount input
- Display current DC balance
- "Withdraw" button (disabled if amount > DC balance)
- Loading state during transaction + polling

**Component Structure**: Similar to deposit, but:
- Validate against DC balance
- Show "DC → USDC" conversion
- Call `WithdrawService`

**Acceptance Criteria**:
- Amount validated against DC balance
- Loading state during transaction
- Success toast on completion
- Returns to home screen

---

### Task 7.2: Withdraw Service
**Files**: `app/src/lib/services/withdraw.ts`

Create withdraw service:
```typescript
/**
 * Withdraw DC → USDC
 * Reference: tests/degen_cash.ts:421-448
 */
export class WithdrawService {
  static async withdraw(
    programService: ProgramService,
    userKeypair: Keypair,
    amount: number, // In DC (6 decimals)
    depositMint: PublicKey
  ): Promise<string> {
    const program = programService.getProgram();
    const arciumEnv = getArciumEnv();
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');

    const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_global_mint')],
      program.programId
    );

    const [dcUserTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_user_token_account'), userKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Get or create withdraw ATA (for global mint PDA)
    const withdrawAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      userKeypair, // Payer
      depositMint,
      dcGlobalMintPDA,
      true // Allow PDA owner
    );

    // Get user's USDC ATA
    const userAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      userKeypair,
      depositMint,
      userKeypair.publicKey
    );

    const signature = await program.methods
      .queueWithdraw(computationOffset, new anchor.BN(amount))
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        payer: userKeypair.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset('withdraw')).readUInt32LE()
        ),
        dcGlobalMintAccount: dcGlobalMintPDA,
        dcUserTokenAccount: dcUserTokenAccount,
        withdrawAta: withdrawAta.address,
        toAta: userAta.address,
        withdrawMint: depositMint,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([userKeypair])
      .rpc({ skipPreflight: false, commitment: 'confirmed' });

    return signature;
  }

  // Polling similar to deposit
}
```

**Acceptance Criteria**:
- Withdraw transaction submits successfully
- Creates necessary ATAs
- Polling detects balance changes
- Error handling for insufficient DC

---

## Phase 8: Transfer (Send) Flow

### Task 8.1: Transfer Screen Component
**Files**: `app/src/routes/send/+page.svelte`

Create transfer screen (reference Figma "Degen Venmo" section):
- Recipient public key input (paste or dropdown)
- Amount input (validate: ≤ 1000 DC, ≤ balance + max variance + fee)
- Variance slider (0-255, default 50)
- Fee display (calculated as `255 - variance` in bps)
- "Send" button
- Loading state during transaction + polling

**Component Structure**:
```svelte
<script lang="ts">
  import { activeWallet, dcBalance, formattedDCBalance } from '$lib/stores/wallet';
  import { TransferService } from '$lib/services/transfer';
  import { ProgramService } from '$lib/services/program';
  import { db } from '$lib/db/schema';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  let recipientPublicKey = '';
  let amount = '';
  let variance = 50;
  let isLoading = false;
  let knownAddresses = [];

  // Load known addresses from DB
  onMount(async () => {
    knownAddresses = await db.knownAddresses.orderBy('lastUsed').reverse().toArray();
  });

  // Calculate fee (255 - variance) in bps
  $: feeBps = 255 - variance;
  $: feePercentage = (feeBps / 100).toFixed(2);

  // Validate amount
  $: maxTransfer = 1000; // 1000 DC limit
  $: maxVarianceCost = Number(amount) * (variance / 255);
  $: maxFeeCost = Number(amount) * (feeBps / 255);
  $: maxTotalCost = Number(amount) + maxVarianceCost + maxFeeCost;
  $: isValid =
    recipientPublicKey &&
    amount &&
    Number(amount) > 0 &&
    Number(amount) <= maxTransfer &&
    maxTotalCost * 1_000_000 <= Number($dcBalance);

  async function handleSend() {
    if (!isValid) return;

    isLoading = true;
    try {
      // Check recipient DC account exists
      const programService = new ProgramService(/* ... */);
      const recipientExists = await programService.dcAccountExists(
        new PublicKey(recipientPublicKey)
      );

      if (!recipientExists) {
        toast.error('Recipient does not have a DC account');
        isLoading = false;
        return;
      }

      // Send transfer
      const signature = await TransferService.transfer(/* ... */);

      // Poll for completion
      await TransferService.pollForCompletion(/* ... */);

      // Save to known addresses
      await db.knownAddresses.add({
        publicKey: recipientPublicKey,
        name: recipientPublicKey.slice(0, 8), // Or generate name
        lastUsed: new Date()
      });

      // Save to transfer history
      await db.transferHistory.add({
        walletPublicKey: $activeWallet!.publicKey,
        recipientPublicKey,
        amount: Number(amount) * 1_000_000,
        variance,
        timestamp: new Date(),
        signature,
        status: 'confirmed'
      });

      toast.success('Transfer sent!');
      goto('/');
    } catch (error) {
      toast.error('Transfer failed');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="send-container">
  <!-- Recipient input -->
  <div class="recipient-input">
    <label>Recipient Address</label>
    <input
      type="text"
      bind:value={recipientPublicKey}
      placeholder="Paste public key"
      list="known-addresses"
    />
    <datalist id="known-addresses">
      {#each knownAddresses as addr}
        <option value={addr.publicKey}>{addr.name}</option>
      {/each}
    </datalist>
  </div>

  <!-- Amount input -->
  <div class="amount-input">
    <input type="number" bind:value={amount} placeholder="0.00" max="1000" />
    <span class="currency">DC</span>
  </div>
  <div class="balance-info">
    <span>Available: {$formattedDCBalance} DC</span>
    <span>Max per transaction: 1000 DC</span>
  </div>

  <!-- Variance slider -->
  <div class="variance-slider">
    <label>Privacy Variance: {variance}/255</label>
    <input type="range" min="0" max="255" bind:value={variance} />
    <span class="fee-info">Fee: {feePercentage}%</span>
  </div>

  <!-- Cost breakdown -->
  <div class="cost-breakdown">
    <div>Base amount: {amount} DC</div>
    <div>Max variance cost: {maxVarianceCost.toFixed(2)} DC</div>
    <div>Fee: {maxFeeCost.toFixed(2)} DC</div>
    <div class="total">Max total: {maxTotalCost.toFixed(2)} DC</div>
  </div>

  <button
    on:click={handleSend}
    disabled={!isValid || isLoading}
    class="send-button"
  >
    {isLoading ? 'Sending...' : 'Send DC'}
  </button>
</div>
```

**Styling** (from Figma):
- Dark background
- Purple slider for variance
- Fee displayed next to slider
- Send button at bottom

**Acceptance Criteria**:
- Validates recipient has DC account before sending
- Enforces 1000 DC per transaction limit
- Enforces balance + variance + fee check
- Variance slider updates fee dynamically
- Saves recipient to known addresses
- Saves to transfer history

---

### Task 8.2: Transfer Service
**Files**: `app/src/lib/services/transfer.ts`

Create transfer service:
```typescript
/**
 * Transfer DC between users with variance
 * Reference: tests/degen_cash.ts:344-371
 */
export class TransferService {
  static async transfer(
    programService: ProgramService,
    senderKeypair: Keypair,
    recipientPublicKey: PublicKey,
    amount: number, // In DC (6 decimals)
    variance: number, // 0-255
    depositMint: PublicKey
  ): Promise<string> {
    const program = programService.getProgram();
    const arciumEnv = getArciumEnv();
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');

    const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_global_mint')],
      program.programId
    );

    const [senderDcTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_user_token_account'), senderKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [receiverDcTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_user_token_account'), recipientPublicKey.toBuffer()],
      program.programId
    );

    const signature = await program.methods
      .queueTransfer(
        computationOffset,
        new anchor.BN(amount),
        variance,
        recipientPublicKey
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        payer: senderKeypair.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset('transfer')).readUInt32LE()
        ),
        dcGlobalMintAccount: dcGlobalMintPDA,
        dcUserTokenAccount: senderDcTokenAccount,
        receiverDcUserTokenAccount: receiverDcTokenAccount,
        depositMint: depositMint
      })
      .signers([senderKeypair])
      .rpc({ skipPreflight: false, commitment: 'confirmed' });

    return signature;
  }

  // Polling for completion
}
```

**Acceptance Criteria**:
- Transfer transaction submits successfully
- Variance parameter passed correctly
- Polling detects balance changes
- Error handling for insufficient balance

---

## Phase 9: Receive Flow

### Task 9.1: Receive Screen Component
**Files**: `app/src/routes/receive/+page.svelte`

Create receive screen:
- Display active wallet public key
- QR code of public key
- "Copy Address" button

**Component Structure**:
```svelte
<script lang="ts">
  import { activeWallet } from '$lib/stores/wallet';
  import { toast } from 'svelte-sonner';
  import QRCode from 'qrcode'; // npm install qrcode

  let qrCodeDataUrl = '';

  onMount(async () => {
    if ($activeWallet) {
      qrCodeDataUrl = await QRCode.toDataURL($activeWallet.publicKey);
    }
  });

  async function copyAddress() {
    await navigator.clipboard.writeText($activeWallet!.publicKey);
    toast.success('Address copied!');
  }
</script>

<div class="receive-container">
  <h2>Receive DC</h2>

  <div class="qr-code">
    <img src={qrCodeDataUrl} alt="Wallet QR Code" />
  </div>

  <div class="address">
    <code>{$activeWallet?.publicKey}</code>
  </div>

  <button on:click={copyAddress}>Copy Address</button>
</div>
```

**Acceptance Criteria**:
- QR code displays correctly
- Copy button works
- Toast confirmation on copy

---

## Phase 10: Wallet Management

### Task 10.1: Wallet Switcher Component
**Files**: `app/src/lib/components/WalletSwitcher.svelte`

Create dropdown component to switch between wallets:
```svelte
<script lang="ts">
  import { activeWallet } from '$lib/stores/wallet';
  import { WalletService } from '$lib/services/wallet';
  import { db } from '$lib/db/schema';
  import { onMount } from 'svelte';

  let wallets = [];
  let isOpen = false;

  onMount(async () => {
    wallets = await WalletService.getAllWallets();
  });

  async function switchWallet(publicKey: string) {
    await WalletService.setActiveWallet(publicKey);
    const wallet = await db.wallets.where('publicKey').equals(publicKey).first();
    activeWallet.set(wallet);
    isOpen = false;
  }
</script>

<div class="wallet-switcher">
  <button on:click={() => isOpen = !isOpen}>
    {$activeWallet?.name}
    <span class="arrow">▼</span>
  </button>

  {#if isOpen}
    <div class="dropdown">
      {#each wallets as wallet}
        <button
          on:click={() => switchWallet(wallet.publicKey)}
          class:active={wallet.publicKey === $activeWallet?.publicKey}
        >
          {wallet.name}
        </button>
      {/each}
      <button on:click={() => goto('/onboarding')}>+ Add Wallet</button>
    </div>
  {/if}
</div>
```

**Acceptance Criteria**:
- Displays all wallets with names
- Switches active wallet on click
- Balances update after switch

---

### Task 10.2: Transaction History Component
**Files**: `app/src/lib/components/TransactionHistory.svelte`

Create transaction history component (show on home screen):
```svelte
<script lang="ts">
  import { activeWallet } from '$lib/stores/wallet';
  import { db } from '$lib/db/schema';
  import { onMount } from 'svelte';

  let history = [];

  onMount(async () => {
    if ($activeWallet) {
      history = await db.transferHistory
        .where('walletPublicKey')
        .equals($activeWallet.publicKey)
        .reverse()
        .sortBy('timestamp');
    }
  });
</script>

<div class="transaction-history">
  <h3>Recent Transfers</h3>
  {#each history as tx}
    <div class="tx-item">
      <div class="tx-recipient">
        To: {tx.recipientName || tx.recipientPublicKey.slice(0, 8)}...
      </div>
      <div class="tx-amount">-{(tx.amount / 1_000_000).toFixed(2)} DC</div>
      <div class="tx-date">{new Date(tx.timestamp).toLocaleDateString()}</div>
      <div class="tx-status">{tx.status}</div>
    </div>
  {/each}
</div>
```

**Acceptance Criteria**:
- Displays recent transfers
- Shows recipient, amount, date, status
- Updates after new transfer

---

## Phase 11: Polish & Testing

### Task 11.1: Error Handling & Validation
**Files**: Various

Add comprehensive error handling:
- Toast errors for all transaction failures
- Network error handling (connection issues)
- Validation error messages
- Loading states for all async operations

**Acceptance Criteria**:
- All errors show user-friendly toasts
- No unhandled promise rejections
- Loading states prevent duplicate submissions

---

### Task 11.2: Mobile Responsiveness
**Files**: `app/src/app.css`, component styles

Ensure mobile-first design:
- Max width: 400px (centered on desktop)
- Touch-friendly button sizes (min 44px)
- Proper input field sizing
- Responsive font sizes

**Acceptance Criteria**:
- Works on mobile (375px width)
- Works on tablet (768px width)
- Works on desktop (centered)

---

### Task 11.3: Loading & Polling Improvements
**Files**: Various services

Improve polling mechanism:
- Add timeout handling (30 seconds max)
- Show polling progress (attempt X of Y)
- Allow cancellation of long operations
- Handle MPC computation failures gracefully

**Acceptance Criteria**:
- Polling never hangs indefinitely
- User can cancel long operations
- Timeout errors show helpful messages

---

### Task 11.4: Dark Theme Styling
**Files**: `app/src/app.css`, Tailwind config

Match Figma design aesthetic:
- Dark background (#0f0f1e or similar)
- Purple/blue gradient accents
- Card-style containers
- Smooth transitions

**Colors** (extracted from Figma):
- Primary: Purple gradient (#6B46FF → #3D2AFF)
- Background: Dark navy (#0f0f1e)
- Card background: Lighter navy (#1a1a2e)
- Text: White (#FFFFFF)
- Secondary text: Gray (#B4B4B4)

**Acceptance Criteria**:
- Matches Figma design closely
- Consistent color scheme
- Smooth animations

---

## Phase 12: Documentation & Deployment

### Task 12.1: Local Testing Documentation
**Files**: `app/README.md`

Document how to run locally:
```markdown
# Degen Cash Demo App

## Prerequisites
- Docker (for Arcium MPC)
- Node.js 18+
- Solana CLI
- Arcium CLI (`arcium keys sync`)

## Setup
1. Start Arcium local network: `arcium test --keep-alive`
2. Run setup script: `npm run setup:localnet`
3. Start dev server: `npm run dev`
4. Visit http://localhost:5173

## Testing Flow
1. Create wallet (auto-generated)
2. Airdrop SOL + USDC
3. Deposit USDC → DC
4. Transfer DC to another wallet
5. Withdraw DC → USDC
```

**Acceptance Criteria**:
- Clear setup instructions
- Troubleshooting section
- Testing flow documented

---

### Task 12.2: Devnet Deployment
**Files**: Various

Deploy to devnet:
1. Run `npm run setup:devnet` with funded keypair
2. Update `.env` with devnet RPC URL
3. Build and deploy SvelteKit app
4. Test all flows on devnet

**Acceptance Criteria**:
- App works on devnet
- No airdrop buttons (removed for devnet)
- All transactions confirm successfully

---

## Task Dependencies

### Critical Path
1. **Phase 0** → **Phase 1** → **Phase 2** → **Phase 3** → **Phase 4**
2. **Phase 5** (account creation) must complete before **Phase 6-8**
3. **Phase 6-8** (deposit, withdraw, transfer) can be done in parallel after Phase 5
4. **Phase 9-10** (receive, wallet management) can be done in parallel
5. **Phase 11** (polish) after all features complete
6. **Phase 12** (deployment) last

### Independent Tasks
- Task 10.2 (transaction history) can be done anytime after Phase 2
- Task 9.1 (receive screen) can be done anytime after Phase 2
- Task 11.4 (dark theme) can be done in parallel with feature development

---

## Development Guidelines

### Code Organization
```
app/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable components
│   │   ├── services/          # Business logic
│   │   ├── stores/            # Svelte stores
│   │   ├── db/                # Dexie schema
│   │   └── utils/             # Helpers
│   ├── routes/                # SvelteKit routes
│   │   ├── +page.svelte       # Home
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── deposit/           # Deposit flow
│   │   ├── withdraw/          # Withdraw flow
│   │   ├── send/              # Transfer flow
│   │   ├── receive/           # Receive flow
│   │   └── api/               # Backend endpoints
│   └── app.css                # Global styles
├── static/                    # Static assets
└── scripts/                   # Setup scripts
```

### Testing Checklist (Per Feature)
- [ ] Happy path works
- [ ] Error cases handled
- [ ] Loading states work
- [ ] Toast notifications work
- [ ] Mobile responsive
- [ ] Matches Figma design
- [ ] Polling completes successfully
- [ ] Balance updates after operation

---

## Open Questions / Future Enhancements

1. **Multi-wallet management**: Allow users to create unlimited wallets?
2. **Export wallet**: Allow users to export secret key for backup?
3. **Transaction details**: Show more details (variance, fees, status codes)?
4. **Notifications**: Desktop notifications for received transfers?
5. **Address book**: Allow users to name saved addresses?
6. **QR scanner**: Scan recipient QR codes instead of pasting?
7. **Fiat on-ramp**: Integrate with fiat payment providers?

---

## References

- **Test file**: `tests/degen_cash.ts` - Complete reference implementation
- **Figma design**: https://www.figma.com/design/32mMZ3v91d1cVZwpkoRSqC/Degen-Cash?node-id=0-1
- **Arcium docs**: https://docs.arcium.com
- **Anchor docs**: https://www.anchor-lang.com
- **SvelteKit docs**: https://kit.svelte.dev

---

## Next Steps

1. Review this plan with team
2. Set up project dependencies (Phase 0)
3. Create setup scripts (Phase 1)
4. Begin feature development (Phase 2+)
5. Test thoroughly on localnet
6. Deploy to devnet
7. Demo!
