# Circuits Serving Route

This route serves compiled Arcium circuits (`.arcis` files) from the `build/` directory at the root of the project.

## How It Works

- **URL Pattern**: `/circuits/[filename].arcis`
- **Source**: `../../build/[filename].arcis`
- **Content Type**: `application/octet-stream`

## Examples

- `http://localhost:5173/circuits/deposit_testnet.arcis`
- `http://localhost:5173/circuits/transfer_testnet.arcis`
- `http://localhost:5173/circuits/withdraw_testnet.arcis`
- `http://localhost:5173/circuits/init_global_dc_mint_testnet.arcis`
- `http://localhost:5173/circuits/init_user_dc_balance_testnet.arcis`

## Security

- Only `.arcis` files are allowed
- Directory traversal attacks are prevented (no `..`, `/`, or `\` in filename)
- Files are served with `Cache-Control` headers for performance

## Configuration

The Rust program's `CIRCUITS_URL` constant must point to this route:

```rust
// programs/degen_cash/src/products/base/consts.rs
pub const CIRCUITS_URL: &str = "http://localhost:5173/circuits/";
```

### For Production

Before deploying to production:

1. Update `CIRCUITS_URL` in the Rust program to your production domain:
   ```rust
   pub const CIRCUITS_URL: &str = "https://your-app-domain.com/circuits/";
   ```

2. Rebuild the Anchor program:
   ```bash
   anchor build
   ```

3. Deploy the updated program to Solana

4. Ensure the `build/` directory is available to the deployed app

## Development Notes

- During development with `arcium test`, you can use either:
  - The existing `serve_circuits.sh` script (serves on port 3131)
  - This SvelteKit route (serves on port 5173)

- The route reads files from `../build/` relative to the app directory, so ensure circuits are compiled before starting the dev server:
  ```bash
  # From project root
  arcium build
  cd app
  bun run dev
  ```
