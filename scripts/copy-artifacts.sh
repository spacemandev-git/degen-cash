#!/bin/bash

# Copy Anchor artifacts from target/ to app/src/lib/anchor/
# Run this script after building the Anchor program (anchor build)

set -e

echo "=================================================="
echo "  Copying Anchor Artifacts to App Directory"
echo "=================================================="
echo ""

# Directories
TARGET_DIR="target"
APP_ANCHOR_DIR="app/src/lib/anchor"

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ Error: target/ directory not found."
  echo "   Run 'anchor build' first to generate artifacts."
  exit 1
fi

# Create app anchor directories if they don't exist
mkdir -p "$APP_ANCHOR_DIR/idl"
mkdir -p "$APP_ANCHOR_DIR/types"
mkdir -p "$APP_ANCHOR_DIR/deploy"

# Copy IDL
echo "📄 Copying IDL..."
if [ -f "$TARGET_DIR/idl/degen_cash.json" ]; then
  cp "$TARGET_DIR/idl/degen_cash.json" "$APP_ANCHOR_DIR/idl/"
  echo "   ✓ IDL copied to $APP_ANCHOR_DIR/idl/degen_cash.json"
else
  echo "   ⚠️  Warning: IDL not found at $TARGET_DIR/idl/degen_cash.json"
fi

# Copy Types
echo "📝 Copying TypeScript types..."
if [ -f "$TARGET_DIR/types/degen_cash.ts" ]; then
  cp "$TARGET_DIR/types/degen_cash.ts" "$APP_ANCHOR_DIR/types/"
  echo "   ✓ Types copied to $APP_ANCHOR_DIR/types/degen_cash.ts"
else
  echo "   ⚠️  Warning: Types not found at $TARGET_DIR/types/degen_cash.ts"
fi

# Copy deployment keypair (but warn about security)
echo "🔑 Copying deployment keypair..."
if [ -f "$TARGET_DIR/deploy/degen_cash-keypair.json" ]; then
  cp "$TARGET_DIR/deploy/degen_cash-keypair.json" "$APP_ANCHOR_DIR/deploy/"
  echo "   ✓ Keypair copied to $APP_ANCHOR_DIR/deploy/degen_cash-keypair.json"
  echo "   ⚠️  WARNING: This keypair should NOT be committed to git!"
  echo "   ⚠️  Make sure $APP_ANCHOR_DIR/deploy/ is in .gitignore"
else
  echo "   ⚠️  Warning: Deployment keypair not found at $TARGET_DIR/deploy/degen_cash-keypair.json"
fi

echo ""
echo "=================================================="
echo "  Artifacts Copied Successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Verify artifacts in $APP_ANCHOR_DIR/"
echo "  2. Update .env with program ID if needed"
echo "  3. Run 'cd app && bun run dev' to start the app"
echo ""
