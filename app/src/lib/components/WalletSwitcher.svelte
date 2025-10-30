<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { WalletService } from '$lib/services/wallet';
	import { activeWallet } from '$lib/stores/wallet';
	import { toast } from 'svelte-sonner';
	import type { Wallet } from '$lib/db/schema';

	let wallets = $state<Wallet[]>([]);
	let isOpen = $state(false);
	let isLoading = $state(false);

	onMount(async () => {
		await loadWallets();
	});

	async function loadWallets() {
		wallets = await WalletService.getAllWallets();
	}

	async function switchWallet(publicKey: string) {
		if (isLoading) return;
		if ($activeWallet?.publicKey === publicKey) {
			isOpen = false;
			return;
		}

		isLoading = true;
		try {
			await WalletService.setActiveWallet(publicKey);
			const wallet = await WalletService.getActiveWallet();
			if (wallet) {
				activeWallet.set(wallet);
				toast.success(`Switched to ${wallet.name}`);
			}
			isOpen = false;

			// Reload the page to refresh balances and accounts
			window.location.href = '/';
		} catch (error) {
			console.error('Failed to switch wallet:', error);
			toast.error('Failed to switch wallet');
		} finally {
			isLoading = false;
		}
	}

	function handleAddWallet() {
		isOpen = false;
		goto('/onboarding');
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.wallet-switcher')) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="wallet-switcher">
	<button class="wallet-btn" on:click={() => (isOpen = !isOpen)} disabled={isLoading}>
		{#if $activeWallet}
			<span class="wallet-icon">👤</span>
			<span class="wallet-name">{$activeWallet.name}</span>
			<span class="arrow" class:open={isOpen}>▼</span>
		{:else}
			<span>Loading...</span>
		{/if}
	</button>

	{#if isOpen}
		<div class="dropdown">
			<div class="dropdown-header">Switch Wallet</div>
			<div class="wallets-list">
				{#each wallets as wallet}
					<button
						class="wallet-item"
						class:active={wallet.publicKey === $activeWallet?.publicKey}
						on:click={() => switchWallet(wallet.publicKey)}
						disabled={isLoading}
					>
						<div class="wallet-info">
							<span class="wallet-item-name">{wallet.name}</span>
							<span class="wallet-address"
								>{wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}</span
							>
						</div>
						{#if wallet.publicKey === $activeWallet?.publicKey}
							<span class="check-icon">✓</span>
						{/if}
					</button>
				{/each}
			</div>
			<button class="add-wallet-btn" on:click={handleAddWallet} disabled={isLoading}>
				<span class="plus-icon">+</span>
				<span>Add Wallet</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.wallet-switcher {
		position: relative;
	}

	.wallet-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(107, 70, 255, 0.1);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 0.75rem;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 150px;
	}

	.wallet-btn:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.2);
		border-color: rgba(107, 70, 255, 0.5);
	}

	.wallet-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.wallet-icon {
		font-size: 1.1rem;
	}

	.wallet-name {
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.arrow {
		font-size: 0.75rem;
		transition: transform 0.2s ease;
		color: #6b46ff;
	}

	.arrow.open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: rgba(26, 26, 46, 0.98);
		border: 1px solid rgba(107, 70, 255, 0.4);
		border-radius: 0.75rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		z-index: 1000;
		min-width: 250px;
		max-height: 400px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.dropdown-header {
		padding: 0.75rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #b4b4b4;
		text-transform: uppercase;
		letter-spacing: 1px;
		border-bottom: 1px solid rgba(107, 70, 255, 0.2);
	}

	.wallets-list {
		flex: 1;
		overflow-y: auto;
		max-height: 300px;
	}

	.wallet-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		transition: background 0.2s ease;
		text-align: left;
	}

	.wallet-item:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.1);
	}

	.wallet-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.wallet-item.active {
		background: rgba(107, 70, 255, 0.15);
	}

	.wallet-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.wallet-item-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: white;
	}

	.wallet-address {
		font-size: 0.75rem;
		color: #8a8a9e;
		font-family: 'Courier New', monospace;
	}

	.check-icon {
		color: #6b46ff;
		font-size: 1.1rem;
		font-weight: bold;
	}

	.add-wallet-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: rgba(107, 70, 255, 0.1);
		border: none;
		border-top: 1px solid rgba(107, 70, 255, 0.2);
		color: #6b46ff;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-wallet-btn:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.2);
	}

	.add-wallet-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.plus-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	@media (max-width: 480px) {
		.wallet-btn {
			min-width: 120px;
			font-size: 0.85rem;
		}

		.dropdown {
			min-width: 220px;
		}
	}
</style>
