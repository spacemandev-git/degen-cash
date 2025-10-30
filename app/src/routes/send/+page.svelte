<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { activeWallet, formattedDCBalance, dcBalance, solBalance } from '$lib/stores/wallet';
	import { ProgramService } from '$lib/services/program';
	import { TransferService } from '$lib/services/transfer';
	import { BalanceFetchService } from '$lib/services/balances';
	import { db } from '$lib/db/schema';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_DEGEN_CASH_PROGRAM_ID, PUBLIC_DEPOSIT_MINT } from '$env/static/public';
	import { PublicKey, Keypair } from '@solana/web3.js';

	let recipientPublicKey = $state('');
	let amount = $state('');
	let variance = $state(50);
	let isLoading = $state(false);
	let programService: ProgramService | null = null;
	let balanceFetchService: BalanceFetchService | null = null;
	let knownAddresses = $state<Array<{ publicKey: string; name: string }>>([]);

	// Reactive calculations
	$: amountNum = Number(amount);
	$: dcBalanceNum = Number($dcBalance);
	$: solBalanceNum = Number($solBalance);
	$: feeBps = 255 - variance;
	$: feePercentage = (feeBps / 100).toFixed(2);
	$: maxVarianceCost = amountNum > 0 ? amountNum * (variance / 255) : 0;
	$: maxFeeCost = amountNum > 0 ? amountNum * (feeBps / 255) : 0;
	$: maxTotalCost = amountNum + maxVarianceCost + maxFeeCost;
	$: maxTransferLimit = 1000; // 1000 DC limit
	$: isValid =
		recipientPublicKey !== '' &&
		amount !== '' &&
		amountNum > 0 &&
		amountNum <= maxTransferLimit &&
		maxTotalCost * 1_000_000 <= dcBalanceNum &&
		solBalanceNum > 0.001 * 1_000_000_000; // At least 0.001 SOL for tx fee

	onMount(async () => {
		if (!$activeWallet) {
			goto('/');
			return;
		}

		// Initialize services
		programService = new ProgramService('/api/rpc', PUBLIC_DEGEN_CASH_PROGRAM_ID);
		balanceFetchService = new BalanceFetchService(programService, PUBLIC_DEPOSIT_MINT);
		await balanceFetchService.initialize();

		// Load known addresses
		knownAddresses = await db.knownAddresses.orderBy('lastUsed').reverse().limit(10).toArray();
	});

	async function handleSend() {
		if (!isValid || !programService || !$activeWallet || !balanceFetchService) return;

		isLoading = true;
		try {
			// Validate recipient public key
			let recipientPubkey: PublicKey;
			try {
				recipientPubkey = new PublicKey(recipientPublicKey);
			} catch {
				toast.error('Invalid recipient address');
				isLoading = false;
				return;
			}

			// Check if recipient has DC account
			const recipientExists = await programService.dcAccountExists(recipientPubkey);
			if (!recipientExists) {
				toast.error('Recipient does not have a DC account');
				isLoading = false;
				return;
			}

			const userKeypair = Keypair.fromSecretKey($activeWallet.secretKey);
			const amountLamports = Math.floor(amountNum * 1_000_000); // Convert to 6 decimals

			toast.info('Submitting transfer to blockchain...');

			const signature = await TransferService.transfer(
				programService.getProgram(),
				userKeypair,
				recipientPubkey,
				amountLamports,
				variance,
				new PublicKey(PUBLIC_DEPOSIT_MINT)
			);

			console.log('Transfer transaction signature:', signature);
			toast.info('Waiting for MPC computation...');

			// Wait for computation (2-3 seconds)
			await TransferService.pollForCompletion();

			// Save to known addresses (if not already there)
			const existingAddress = await db.knownAddresses
				.where('publicKey')
				.equals(recipientPublicKey)
				.first();

			if (!existingAddress) {
				await db.knownAddresses.add({
					publicKey: recipientPublicKey,
					name: recipientPublicKey.slice(0, 8) + '...',
					lastUsed: new Date()
				});
			} else {
				await db.knownAddresses.update(existingAddress.id!, { lastUsed: new Date() });
			}

			// Save to transfer history
			await db.transferHistory.add({
				walletPublicKey: $activeWallet.publicKey,
				recipientPublicKey,
				amount: amountLamports,
				variance,
				timestamp: new Date(),
				signature,
				status: 'confirmed'
			});

			// Refresh balances
			await balanceFetchService.fetchAllBalances();

			toast.success(`${amount} DC sent successfully!`);
			await goto('/');
		} catch (error) {
			console.error('Transfer error:', error);
			toast.error('Transfer failed: ' + (error as Error).message);
		} finally {
			isLoading = false;
		}
	}

	function handleMaxClick() {
		if ($dcBalance) {
			// Calculate max amount considering variance and fees
			// Solve: amount + amount*(variance/255) + amount*((255-variance)/255) <= balance
			// amount * (1 + variance/255 + (255-variance)/255) <= balance
			// amount * (1 + 1) = amount * 2 <= balance
			// amount <= balance / 2
			const maxAmount = Math.min(
				(Number($dcBalance) / 1_000_000) / 2,
				maxTransferLimit
			);
			amount = maxAmount.toFixed(2);
		}
	}

	function selectKnownAddress(address: string) {
		recipientPublicKey = address;
	}
</script>

<div class="send-container">
	<!-- Header -->
	<div class="header">
		<button class="back-btn" on:click={() => goto('/')}>
			<span>←</span>
		</button>
		<h1>Send DC</h1>
		<div></div>
	</div>

	<!-- Balance Info -->
	<div class="balance-info">
		<div class="balance-label">Available DC</div>
		<div class="balance-amount">{$formattedDCBalance} DC</div>
		<div class="balance-note">Max per transaction: {maxTransferLimit} DC</div>
	</div>

	<!-- Recipient Input -->
	<div class="input-section">
		<div class="input-label">Recipient Address</div>
		<div class="recipient-input-wrapper">
			<input
				type="text"
				bind:value={recipientPublicKey}
				placeholder="Paste wallet address"
				disabled={isLoading}
				class="recipient-input"
			/>
		</div>

		<!-- Known Addresses Dropdown -->
		{#if knownAddresses.length > 0}
			<details class="known-addresses">
				<summary>Recent addresses</summary>
				<div class="addresses-list">
					{#each knownAddresses as addr}
						<button
							class="address-item"
							on:click={() => selectKnownAddress(addr.publicKey)}
							disabled={isLoading}
						>
							<span class="address-name">{addr.name}</span>
							<span class="address-key">{addr.publicKey.slice(0, 8)}...{addr.publicKey.slice(-8)}</span>
						</button>
					{/each}
				</div>
			</details>
		{/if}
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
				max={maxTransferLimit}
				step="0.01"
				disabled={isLoading}
				class="amount-input"
			/>
			<span class="currency-label">DC</span>
		</div>
		<button class="max-btn" on:click={handleMaxClick} disabled={isLoading}>MAX</button>
	</div>

	<!-- Variance Slider -->
	<div class="variance-section">
		<div class="variance-header">
			<span class="variance-label">Privacy Variance</span>
			<span class="variance-value">{variance}/255</span>
		</div>
		<input
			type="range"
			min="0"
			max="255"
			bind:value={variance}
			disabled={isLoading}
			class="variance-slider"
		/>
		<div class="variance-footer">
			<span class="fee-info">Fee: {feePercentage}%</span>
			<span class="variance-note">Higher variance = more privacy, lower fee</span>
		</div>
	</div>

	<!-- Cost Breakdown -->
	{#if amount && amountNum > 0}
		<div class="preview-card">
			<div class="preview-row">
				<span>Base amount</span>
				<span class="preview-value">{amount} DC</span>
			</div>
			<div class="preview-row">
				<span>Max variance cost</span>
				<span class="preview-value">+{maxVarianceCost.toFixed(2)} DC</span>
			</div>
			<div class="preview-row">
				<span>Fee ({feePercentage}%)</span>
				<span class="preview-value">+{maxFeeCost.toFixed(2)} DC</span>
			</div>
			<div class="preview-divider"></div>
			<div class="preview-row total">
				<span>Max total cost</span>
				<span class="preview-value">{maxTotalCost.toFixed(2)} DC</span>
			</div>
			<div class="preview-note">
				Actual cost may be lower due to random variance and NAV adjustments
			</div>
		</div>
	{/if}

	<!-- Warnings -->
	{#if amountNum > 0 && amountNum > maxTransferLimit}
		<div class="warning-card">
			⚠️ Transfer amount exceeds {maxTransferLimit} DC limit
		</div>
	{/if}

	{#if solBalanceNum <= 0.001 * 1_000_000_000}
		<div class="warning-card">
			⚠️ Insufficient SOL for transaction fee (need at least 0.001 SOL)
		</div>
	{/if}

	<!-- Send Button -->
	<button class="send-btn" on:click={handleSend} disabled={!isValid || isLoading}>
		{#if isLoading}
			<span class="spinner"></span>
			<span>Sending...</span>
		{:else}
			Send {amount || '0.00'} DC
		{/if}
	</button>
</div>

<style>
	.send-container {
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
		margin-bottom: 0.5rem;
	}

	.balance-note {
		font-size: 0.75rem;
		color: #8a8a9e;
	}

	.input-section {
		margin-bottom: 1.5rem;
	}

	.input-label {
		font-size: 0.9rem;
		color: #b4b4b4;
		margin-bottom: 0.75rem;
	}

	.recipient-input-wrapper {
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

	.recipient-input-wrapper:focus-within {
		border-color: rgba(107, 70, 255, 0.6);
	}

	.recipient-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: white;
		font-size: 0.95rem;
		font-family: 'Courier New', monospace;
		padding: 1rem 0;
	}

	.recipient-input::placeholder {
		color: #4a4a5e;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.recipient-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.known-addresses {
		margin-top: 0.5rem;
	}

	.known-addresses summary {
		font-size: 0.85rem;
		color: #6b46ff;
		cursor: pointer;
		user-select: none;
		padding: 0.5rem;
	}

	.known-addresses summary:hover {
		color: #8a6aff;
	}

	.addresses-list {
		margin-top: 0.5rem;
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.address-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		background: transparent;
		border: none;
		padding: 0.75rem;
		color: white;
		cursor: pointer;
		border-radius: 0.5rem;
		transition: background 0.2s ease;
	}

	.address-item:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.1);
	}

	.address-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.address-name {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.address-key {
		font-size: 0.8rem;
		color: #8a8a9e;
		font-family: 'Courier New', monospace;
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

	.variance-section {
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.variance-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.variance-label {
		font-size: 0.9rem;
		color: #b4b4b4;
	}

	.variance-value {
		font-size: 1.1rem;
		color: white;
		font-weight: 600;
	}

	.variance-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			rgba(107, 70, 255, 0.3),
			rgba(107, 70, 255, 0.7)
		);
		outline: none;
		-webkit-appearance: none;
		margin-bottom: 1rem;
	}

	.variance-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(107, 70, 255, 0.5);
	}

	.variance-slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(107, 70, 255, 0.5);
	}

	.variance-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.variance-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.fee-info {
		font-size: 0.95rem;
		color: #6b46ff;
		font-weight: 600;
	}

	.variance-note {
		font-size: 0.75rem;
		color: #8a8a9e;
	}

	.preview-card {
		background: rgba(107, 70, 255, 0.05);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 1rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
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

	.preview-row.total {
		font-size: 1.05rem;
		font-weight: 600;
		color: white;
	}

	.preview-value {
		color: white;
		font-weight: 600;
	}

	.preview-divider {
		height: 1px;
		background: rgba(107, 70, 255, 0.2);
		margin: 0.75rem 0;
	}

	.preview-note {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(107, 70, 255, 0.2);
		font-size: 0.8rem;
		color: #8a8a9e;
		text-align: center;
	}

	.warning-card {
		background: rgba(255, 177, 66, 0.1);
		border: 1px solid rgba(255, 177, 66, 0.3);
		border-radius: 0.75rem;
		padding: 1rem;
		color: #ffb142;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.send-btn {
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

	.send-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(107, 70, 255, 0.3);
	}

	.send-btn:disabled {
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
		.send-container {
			padding: 1.5rem 1rem;
		}

		.amount-input {
			font-size: 1.5rem;
		}

		.balance-amount {
			font-size: 1.75rem;
		}

		.variance-note {
			display: none;
		}
	}
</style>
