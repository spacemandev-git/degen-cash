<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		activeWallet,
		formattedUSDCBalance,
		usdcBalance,
		formattedDCBalance
	} from '$lib/stores/wallet';
	import { ProgramService } from '$lib/services/program';
	import { DepositService } from '$lib/services/deposit';
	import { BalanceFetchService } from '$lib/services/balances';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_DEGEN_CASH_PROGRAM_ID, PUBLIC_DEPOSIT_MINT } from '$env/static/public';
	import { PublicKey, Keypair } from '@solana/web3.js';

	let amount = $state('');
	let isLoading = $state(false);
	let programService: ProgramService | null = null;
	let balanceFetchService: BalanceFetchService | null = null;

	// Reactive validation
	$: amountNum = Number(amount);
	$: usdcBalanceNum = Number($usdcBalance);
	$: isValid = amount !== '' && amountNum > 0 && amountNum * 1_000_000 <= usdcBalanceNum;

	onMount(async () => {
		if (!$activeWallet) {
			goto('/');
			return;
		}

		// Initialize services
		programService = new ProgramService('/api/rpc', PUBLIC_DEGEN_CASH_PROGRAM_ID);
		balanceFetchService = new BalanceFetchService(programService, PUBLIC_DEPOSIT_MINT);
		await balanceFetchService.initialize();
	});

	async function handleDeposit() {
		if (!isValid || !programService || !$activeWallet || !balanceFetchService) return;

		isLoading = true;
		try {
			const userKeypair = Keypair.fromSecretKey($activeWallet.secretKey);
			const amountLamports = Math.floor(amountNum * 1_000_000); // Convert to 6 decimals

			toast.info('Submitting deposit to blockchain...');

			const signature = await DepositService.deposit(
				programService,
				userKeypair,
				amountLamports,
				new PublicKey(PUBLIC_DEPOSIT_MINT)
			);

			console.log('Deposit transaction signature:', signature);
			toast.info('Waiting for MPC computation...');

			// Wait for computation (2-3 seconds)
			await new Promise((resolve) => setTimeout(resolve, 2500));

			// Refresh balances
			await balanceFetchService.fetchAllBalances();

			toast.success(`${amount} USDC deposited successfully!`);
			await goto('/');
		} catch (error) {
			console.error('Deposit error:', error);
			toast.error('Deposit failed: ' + (error as Error).message);
		} finally {
			isLoading = false;
		}
	}

	function handleMaxClick() {
		if ($usdcBalance) {
			amount = (Number($usdcBalance) / 1_000_000).toFixed(2);
		}
	}
</script>

<div class="deposit-container">
	<!-- Header -->
	<div class="header">
		<button class="back-btn" on:click={() => goto('/')}>
			<span>←</span>
		</button>
		<h1>Deposit</h1>
		<div></div>
	</div>

	<!-- Balance Info -->
	<div class="balance-info">
		<div class="balance-label">Available USDC</div>
		<div class="balance-amount">{$formattedUSDCBalance} USDC</div>
	</div>

	<!-- Amount Input -->
	<div class="input-section">
		<div class="input-label">Amount</div>
		<div class="amount-input-wrapper">
			<input
				type="number"
				bind:value={amount}
				placeholder="0.00"
				min="0"
				step="0.01"
				disabled={isLoading}
				class="amount-input"
			/>
			<span class="currency-label">USDC</span>
		</div>
		<button class="max-btn" on:click={handleMaxClick} disabled={isLoading}>MAX</button>
	</div>

	<!-- Preview -->
	{#if amount && amountNum > 0}
		<div class="preview-card">
			<div class="preview-row">
				<span>You deposit</span>
				<span class="preview-value">{amount} USDC</span>
			</div>
			<div class="preview-row">
				<span>You receive</span>
				<span class="preview-value">≈ {amount} DC</span>
			</div>
			<div class="preview-note">Initial deposits have 1:1 ratio</div>
		</div>
	{/if}

	<!-- Deposit Button -->
	<button class="deposit-btn" on:click={handleDeposit} disabled={!isValid || isLoading}>
		{#if isLoading}
			<span class="spinner"></span>
			<span>Processing...</span>
		{:else}
			Deposit {amount || '0.00'} USDC
		{/if}
	</button>
</div>

<style>
	.deposit-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		max-width: 500px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.back-btn {
		background: rgba(107, 70, 255, 0.1);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		color: white;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: rgba(107, 70, 255, 0.2);
	}

	h1 {
		font-size: 1.5rem;
		color: white;
		font-weight: 600;
		margin: 0;
	}

	.balance-info {
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	.balance-label {
		font-size: 0.85rem;
		color: #b4b4b4;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.balance-amount {
		font-size: 2rem;
		font-weight: bold;
		color: white;
	}

	.input-section {
		margin-bottom: 1.5rem;
	}

	.input-label {
		font-size: 0.9rem;
		color: #b4b4b4;
		margin-bottom: 0.75rem;
	}

	.amount-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: rgba(15, 15, 30, 0.5);
		border: 2px solid rgba(107, 70, 255, 0.3);
		border-radius: 0.75rem;
		padding: 0 1.25rem;
		margin-bottom: 0.75rem;
		transition: border-color 0.2s ease;
	}

	.amount-input-wrapper:focus-within {
		border-color: rgba(107, 70, 255, 0.6);
	}

	.amount-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: white;
		font-size: 1.75rem;
		font-weight: 600;
		padding: 1rem 0;
	}

	.amount-input::placeholder {
		color: #4a4a5e;
	}

	.amount-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Remove number input arrows */
	.amount-input::-webkit-outer-spin-button,
	.amount-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.amount-input[type='number'] {
		-moz-appearance: textfield;
	}

	.currency-label {
		font-size: 1.25rem;
		color: #6b46ff;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.max-btn {
		background: rgba(107, 70, 255, 0.15);
		border: 1px solid rgba(107, 70, 255, 0.4);
		border-radius: 0.5rem;
		padding: 0.5rem 1.5rem;
		color: #6b46ff;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		letter-spacing: 1px;
	}

	.max-btn:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.25);
		transform: translateY(-1px);
	}

	.max-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.preview-card {
		background: rgba(107, 70, 255, 0.05);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 1rem;
		padding: 1.25rem;
		margin-bottom: 2rem;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		color: #b4b4b4;
		font-size: 0.95rem;
	}

	.preview-row:first-child {
		padding-top: 0;
	}

	.preview-row:last-of-type {
		padding-bottom: 0;
	}

	.preview-value {
		color: white;
		font-weight: 600;
	}

	.preview-note {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(107, 70, 255, 0.2);
		font-size: 0.8rem;
		color: #8a8a9e;
		text-align: center;
	}

	.deposit-btn {
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		border: none;
		border-radius: 0.75rem;
		padding: 1.25rem;
		color: white;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.deposit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(107, 70, 255, 0.3);
	}

	.deposit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.deposit-container {
			padding: 1.5rem 1rem;
		}

		.amount-input {
			font-size: 1.5rem;
		}

		.balance-amount {
			font-size: 1.75rem;
		}
	}
</style>
