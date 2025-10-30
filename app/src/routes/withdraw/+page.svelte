<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { Keypair, PublicKey } from '@solana/web3.js';
  import { activeWallet, dcBalance, formattedDCBalance, solBalance } from '$lib/stores/wallet';
  import { ProgramService } from '$lib/services/program';
  import { BalanceService } from '$lib/services/balance';
  import { WithdrawService } from '$lib/services/withdraw';
  import { BalanceFetchService } from '$lib/services/balances';
  import { PUBLIC_DEGEN_CASH_PROGRAM_ID } from '$env/static/public';

  let amount = '';
  let isLoading = false;
  let programService: ProgramService;
  let balanceService: BalanceFetchService;
  let mxePublicKey: Uint8Array | null = null;

  onMount(async () => {
    // Initialize services
    programService = new ProgramService('/api/rpc', PUBLIC_DEGEN_CASH_PROGRAM_ID);
    balanceService = new BalanceFetchService(programService);
    await balanceService.initialize();
    mxePublicKey = balanceService.getMxePublicKey();
  });

  // Validate amount
  $: isValid =
    amount &&
    Number(amount) > 0 &&
    Number(amount) * 1_000_000 <= Number($dcBalance) &&
    Number($solBalance) > 5000; // 0.000005 SOL minimum for transaction fee

  // Preview calculations
  $: amountInLamports = Number(amount) * 1_000_000;
  $: willReceiveUSDC = amount; // 1:1 ratio for display (actual may vary due to NAV)

  async function handleWithdraw() {
    if (!isValid || !$activeWallet || !mxePublicKey) return;

    isLoading = true;
    try {
      // Reconstruct keypair
      const userKeypair = Keypair.fromSecretKey($activeWallet.secretKey);
      const depositMint = new PublicKey(import.meta.env.PUBLIC_DEPOSIT_MINT);

      // Get current balance before withdraw
      const dcAccount = await programService.getDCTokenAccount(userKeypair.publicKey);
      if (!dcAccount) {
        toast.error('DC account not found');
        isLoading = false;
        return;
      }
      const previousBalance = await BalanceService.getDecryptedBalance(
        dcAccount,
        $activeWallet.x25519PrivateKey,
        mxePublicKey
      );

      // Submit withdraw transaction
      toast.info('Submitting withdraw transaction...');
      const signature = await WithdrawService.withdraw(
        programService,
        userKeypair,
        amountInLamports,
        depositMint
      );

      // Poll for completion
      toast.info('Waiting for MPC computation...');
      await WithdrawService.pollForCompletion(
        programService,
        userKeypair.publicKey,
        $activeWallet.x25519PrivateKey,
        mxePublicKey,
        previousBalance,
        amountInLamports.toString()
      );

      // Refresh balances
      await balanceService.fetchAllBalances();

      toast.success(`Successfully withdrew ${amount} DC to USDC!`);
      goto('/');
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.error(`Withdraw failed: ${error.message || 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }

  function setMaxAmount() {
    amount = (Number($dcBalance) / 1_000_000).toString();
  }

  function goBack() {
    goto('/');
  }
</script>

<div class="withdraw-container">
  <button class="back-button" on:click={goBack} disabled={isLoading}>
    ← Back
  </button>

  <h1>Withdraw DC</h1>
  <p class="subtitle">Burn DC tokens to receive USDC</p>

  <div class="balance-card">
    <div class="balance-label">Available DC Balance</div>
    <div class="balance-amount">{$formattedDCBalance} DC</div>
  </div>

  <div class="amount-section">
    <label for="amount">Amount to Withdraw</label>
    <div class="input-wrapper">
      <input
        id="amount"
        type="number"
        bind:value={amount}
        placeholder="0.00"
        step="0.01"
        min="0"
        disabled={isLoading}
      />
      <span class="currency-label">DC</span>
      <button class="max-button" on:click={setMaxAmount} disabled={isLoading}>
        MAX
      </button>
    </div>
  </div>

  {#if amount && Number(amount) > 0}
    <div class="preview-card">
      <h3>Preview</h3>
      <div class="preview-row">
        <span>You will burn:</span>
        <span class="preview-value">{amount} DC</span>
      </div>
      <div class="preview-row">
        <span>You will receive:</span>
        <span class="preview-value">~{willReceiveUSDC} USDC</span>
      </div>
      <div class="preview-note">
        * Actual USDC received may vary based on current NAV
      </div>
    </div>
  {/if}

  {#if !isValid && amount}
    <div class="error-message">
      {#if Number(amount) * 1_000_000 > Number($dcBalance)}
        Insufficient DC balance
      {:else if Number($solBalance) <= 5000}
        Insufficient SOL for transaction fees
      {:else}
        Invalid amount
      {/if}
    </div>
  {/if}

  <button
    class="withdraw-button"
    on:click={handleWithdraw}
    disabled={!isValid || isLoading}
  >
    {#if isLoading}
      <span class="spinner"></span>
      Processing...
    {:else}
      Withdraw to USDC
    {/if}
  </button>
</div>

<style>
  .withdraw-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
  }

  .back-button {
    background: transparent;
    border: none;
    color: #b4b4b4;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
    transition: color 0.2s;
  }

  .back-button:hover:not(:disabled) {
    color: #ffffff;
  }

  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: #b4b4b4;
    margin-bottom: 2rem;
  }

  .balance-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .balance-label {
    font-size: 0.875rem;
    color: #b4b4b4;
    margin-bottom: 0.5rem;
  }

  .balance-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
  }

  .amount-section {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    color: #b4b4b4;
    margin-bottom: 0.5rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type='number'] {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    font-size: 1.25rem;
    color: #ffffff;
    transition: all 0.2s;
  }

  input[type='number']:focus {
    outline: none;
    border-color: #6b46ff;
    box-shadow: 0 0 0 3px rgba(107, 70, 255, 0.1);
  }

  input[type='number']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Remove number input arrows */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  .currency-label {
    position: absolute;
    right: 5rem;
    color: #b4b4b4;
    font-size: 1rem;
    pointer-events: none;
  }

  .max-button {
    background: rgba(107, 70, 255, 0.2);
    border: 1px solid rgba(107, 70, 255, 0.4);
    border-radius: 8px;
    color: #6b46ff;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .max-button:hover:not(:disabled) {
    background: rgba(107, 70, 255, 0.3);
    border-color: #6b46ff;
  }

  .max-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .preview-card {
    background: rgba(107, 70, 255, 0.1);
    border: 1px solid rgba(107, 70, 255, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .preview-card h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #ffffff;
  }

  .preview-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }

  .preview-row span:first-child {
    color: #b4b4b4;
  }

  .preview-value {
    color: #ffffff;
    font-weight: 600;
  }

  .preview-note {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.75rem;
    color: #b4b4b4;
    font-style: italic;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #ef4444;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .withdraw-button {
    width: 100%;
    background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
    border: none;
    border-radius: 12px;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .withdraw-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(107, 70, 255, 0.3);
  }

  .withdraw-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .withdraw-container {
      padding: 1.5rem 1rem;
    }

    h1 {
      font-size: 1.75rem;
    }

    input[type='number'] {
      font-size: 1.125rem;
    }
  }
</style>
