<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { WalletService } from '$lib/services/wallet';
	import { ProgramService } from '$lib/services/program';
	import { BalanceFetchService } from '$lib/services/balances';
	import { AirdropService } from '$lib/services/airdrop';
	import { AccountService } from '$lib/services/account';
	import WalletSwitcher from '$lib/components/WalletSwitcher.svelte';
	import TransactionHistory from '$lib/components/TransactionHistory.svelte';
	import {
		activeWallet,
		formattedDCBalance,
		formattedUSDCBalance,
		formattedSOLBalance,
		isLoadingBalances
	} from '$lib/stores/wallet';
	import { toast } from 'svelte-sonner';
	import {
		PUBLIC_DEGEN_CASH_PROGRAM_ID,
		PUBLIC_DEPOSIT_MINT,
		PUBLIC_NETWORK
	} from '$env/static/public';
	import { PublicKey, Keypair } from '@solana/web3.js';

	let balanceFetchService: BalanceFetchService | null = null;
	let airdropService: AirdropService | null = null;
	let isAirdropping = $state(false);
	let isInitializing = $state(true);
	let initMessage = $state('Initializing...');

	onMount(async () => {
		// Load active wallet
		const wallet = await WalletService.getActiveWallet();
		if (wallet) {
			activeWallet.set(wallet);

			// Initialize services
			const programService = new ProgramService('/api/rpc', PUBLIC_DEGEN_CASH_PROGRAM_ID);

			try {
				// Check and create DC account if needed
				initMessage = 'Checking DC account...';
				const userKeypair = Keypair.fromSecretKey(wallet.secretKey);

				const hasDCAccount = await AccountService.hasDCAccount(
					programService,
					userKeypair.publicKey
				);

				if (!hasDCAccount) {
					toast.info('Setting up your DC account for the first time...');
					await AccountService.ensureDCAccount(
						programService,
						userKeypair,
						wallet.x25519PublicKey,
						(message) => {
							initMessage = message;
						}
					);
					toast.success('DC account created!');
				}

				// Initialize balance service
				initMessage = 'Loading balances...';
				balanceFetchService = new BalanceFetchService(programService, PUBLIC_DEPOSIT_MINT);
				await balanceFetchService.initialize();

				// Start polling balances every 5 seconds
				balanceFetchService.startPolling(5);

				// Initialize airdrop service
				airdropService = new AirdropService(programService, PUBLIC_NETWORK);

				isInitializing = false;
			} catch (error) {
				console.error('Failed to initialize:', error);
				toast.error('Failed to connect to blockchain. Check your network connection.');
				isInitializing = false;
			}
		}
	});

	onDestroy(() => {
		// Stop polling when component unmounts
		if (balanceFetchService) {
			balanceFetchService.stopPolling();
		}
	});

	async function handleAirdropSOL() {
		if (!airdropService || !$activeWallet) return;

		isAirdropping = true;
		try {
			const signature = await airdropService.airdropSOL(
				new PublicKey($activeWallet.publicKey),
				1
			);
			toast.success('1 SOL airdropped!');
			console.log('SOL airdrop signature:', signature);

			// Refresh balances
			if (balanceFetchService) {
				await balanceFetchService.fetchAllBalances();
			}
		} catch (error) {
			console.error('SOL airdrop error:', error);
			toast.error('SOL airdrop failed');
		} finally {
			isAirdropping = false;
		}
	}

	async function handleAirdropUSDC() {
		if (!airdropService || !$activeWallet) return;

		isAirdropping = true;
		try {
			const signature = await airdropService.airdropUSDC(
				new PublicKey($activeWallet.publicKey),
				10000
			);
			toast.success('10,000 USDC airdropped!');
			console.log('USDC airdrop signature:', signature);

			// Refresh balances
			if (balanceFetchService) {
				await balanceFetchService.fetchAllBalances();
			}
		} catch (error) {
			console.error('USDC airdrop error:', error);
			toast.error((error as Error).message || 'USDC airdrop failed');
		} finally {
			isAirdropping = false;
		}
	}
</script>

<div class="home-container">
	<!-- Initialization Loading Overlay -->
	{#if isInitializing}
		<div class="init-overlay">
			<div class="init-card">
				<div class="spinner-large"></div>
				<div class="init-message">{initMessage}</div>
			</div>
		</div>
	{/if}

	<div class="home-card">
		<!-- Header with wallet switcher -->
		<div class="header">
			<WalletSwitcher />
		</div>

		<!-- Balance Display -->
		<div class="balance-section">
			<div class="balance-card dc-balance">
				<div class="balance-label">DC Balance</div>
				<div class="balance-amount">
					{#if $isLoadingBalances}
						<span class="loading-shimmer">Loading...</span>
					{:else}
						{$formattedDCBalance} <span class="currency">DC</span>
					{/if}
				</div>
			</div>

			<div class="balance-row">
				<div class="balance-card small">
					<div class="balance-label">USDC</div>
					<div class="balance-amount small">
						{#if $isLoadingBalances}
							...
						{:else}
							{$formattedUSDCBalance}
						{/if}
					</div>
				</div>
				<div class="balance-card small">
					<div class="balance-label">SOL</div>
					<div class="balance-amount small">
						{#if $isLoadingBalances}
							...
						{:else}
							{$formattedSOLBalance}
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="actions">
			<button class="action-btn" on:click={() => goto('/deposit')}>
				<span class="icon">💰</span>
				<span>Deposit</span>
			</button>
			<button class="action-btn" on:click={() => goto('/withdraw')}>
				<span class="icon">💸</span>
				<span>Withdraw</span>
			</button>
			<button class="action-btn" on:click={() => goto('/send')}>
				<span class="icon">📤</span>
				<span>Send</span>
			</button>
			<button class="action-btn" on:click={() => goto('/receive')}>
				<span class="icon">📥</span>
				<span>Receive</span>
			</button>
		</div>

		<!-- Airdrop Buttons (localhost only) -->
		{#if PUBLIC_NETWORK === 'localhost'}
			<div class="airdrops">
				<div class="airdrop-label">🚰 Testnet Faucets</div>
				<div class="airdrop-buttons">
					<button
						class="airdrop-btn"
						on:click={handleAirdropSOL}
						disabled={isAirdropping || $isLoadingBalances}
					>
						{isAirdropping ? 'Airdropping...' : 'Airdrop 1 SOL'}
					</button>
					<button
						class="airdrop-btn"
						on:click={handleAirdropUSDC}
						disabled={isAirdropping || $isLoadingBalances}
					>
						{isAirdropping ? 'Airdropping...' : 'Airdrop 10k USDC'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Transaction History -->
		<TransactionHistory />
	</div>
</div>

<style>
	.home-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
		padding: 1rem;
	}

	.home-card {
		background: rgba(26, 26, 46, 0.8);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 1.5rem;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(107, 70, 255, 0.1);
	}

	.header {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.balance-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.balance-card {
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		text-align: center;
	}

	.balance-card.dc-balance {
		background: linear-gradient(135deg, rgba(107, 70, 255, 0.1) 0%, rgba(61, 42, 255, 0.1) 100%);
		border: 1px solid rgba(107, 70, 255, 0.4);
	}

	.balance-label {
		font-size: 0.85rem;
		color: #b4b4b4;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.balance-amount {
		font-size: 2.5rem;
		font-weight: bold;
		color: white;
	}

	.balance-amount.small {
		font-size: 1.25rem;
	}

	.balance-amount .currency {
		font-size: 1.5rem;
		color: #6b46ff;
	}

	.loading-shimmer {
		font-size: 1rem;
		color: #666;
	}

	.balance-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.balance-card.small {
		padding: 1rem;
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 1rem;
		background: rgba(107, 70, 255, 0.1);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 0.75rem;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: rgba(107, 70, 255, 0.2);
		border-color: rgba(107, 70, 255, 0.5);
		transform: translateY(-2px);
	}

	.action-btn .icon {
		font-size: 1.75rem;
	}

	.airdrops {
		padding-top: 1.5rem;
		border-top: 1px solid rgba(107, 70, 255, 0.2);
	}

	.airdrop-label {
		text-align: center;
		font-size: 0.85rem;
		color: #b4b4b4;
		margin-bottom: 1rem;
	}

	.airdrop-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.airdrop-btn {
		padding: 0.75rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 0.5rem;
		color: #f59e0b;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.airdrop-btn:hover:not(:disabled) {
		background: rgba(245, 158, 11, 0.2);
		border-color: rgba(245, 158, 11, 0.5);
	}

	.airdrop-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Initialization Overlay */
	.init-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(15, 15, 30, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(8px);
	}

	.init-card {
		background: rgba(26, 26, 46, 0.9);
		border: 1px solid rgba(107, 70, 255, 0.4);
		border-radius: 1.5rem;
		padding: 3rem 2rem;
		text-align: center;
		max-width: 350px;
		width: 90%;
		box-shadow: 0 20px 60px rgba(107, 70, 255, 0.2);
	}

	.spinner-large {
		width: 60px;
		height: 60px;
		margin: 0 auto 2rem;
		border: 4px solid rgba(107, 70, 255, 0.2);
		border-top-color: #6b46ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.init-message {
		font-size: 1.1rem;
		color: white;
		font-weight: 500;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.home-card {
			padding: 1.5rem;
		}

		.balance-amount {
			font-size: 2rem;
		}

		.action-btn .icon {
			font-size: 1.5rem;
		}
	}
</style>
