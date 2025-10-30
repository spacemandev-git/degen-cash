# Anchor Artifacts

This directory contains Anchor program artifacts copied from the project's `target/` directory.

## Directory Structure

```
anchor/
├── idl/
│   └── degen_cash.json       # Program IDL (Interface Definition Language)
├── types/
│   └── degen_cash.ts         # TypeScript types generated from IDL
└── deploy/
    └── degen_cash-keypair.json  # Program deployment keypair (GITIGNORED)
```

## Usage

### Copying Artifacts

After building the Anchor program, copy the artifacts to this directory:

```bash
# From project root
anchor build

# Copy artifacts to app
bun run copy-artifacts
```

### What Gets Copied

1. **IDL** (`idl/degen_cash.json`):
   - Interface definition for the program
   - Used by Anchor client to interact with the program
   - Safe to commit to git

2. **Types** (`types/degen_cash.ts`):
   - TypeScript type definitions generated from IDL
   - Provides type safety when calling program methods
   - Safe to commit to git

3. **Deployment Keypair** (`deploy/degen_cash-keypair.json`):
   - Keypair used to deploy the program (program's address)
   - **MUST NOT** be committed to git (contains secret key)
   - Protected by `.gitignore`

## When to Run `copy-artifacts`

Run the copy script after:
- Building the program for the first time
- Making changes to the program's interface (new instructions, account changes)
- Deploying a new version of the program

## Security Note

⚠️ **IMPORTANT**: The `deploy/` directory is gitignored because it contains the program deployment keypair. While this keypair is typically safe to share for a testnet/devnet program, it's good practice to keep it private.

For production programs, the deployment keypair should be treated as a critical secret.

## Using in Code

Import the IDL and types in your Svelte components or services:

```typescript
import idlJson from '$lib/anchor/idl/degen_cash.json';
import type { DegenCash } from '$lib/anchor/types/degen_cash';

// Use with Anchor Program
const program = new Program(
  idlJson as anchor.Idl,
  provider
) as unknown as Program<DegenCash>;
```

## Troubleshooting

### Types are outdated

If TypeScript complains about missing methods or account types:
1. Rebuild the program: `anchor build`
2. Copy artifacts: `bun run copy-artifacts`
3. Restart the dev server: `cd app && bun run dev`

### Program ID mismatch

If you get "program ID mismatch" errors:
1. Check the program ID in `idl/degen_cash.json` (under `address` or `metadata.address`)
2. Update `.env` with the correct `PUBLIC_DEGEN_CASH_PROGRAM_ID`
3. Restart the dev server
