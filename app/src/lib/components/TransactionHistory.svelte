<script lang="ts">
	import { onMount } from 'svelte';
	import { activeWallet } from '$lib/stores/wallet';
	import { db, type TransferHistory } from '$lib/db/schema';

	let history = $state<TransferHistory[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		await loadHistory();
	});

	async function loadHistory() {
		if (!$activeWallet) {
			isLoading = false;
			return;
		}

		try {
			const transfers = await db.transferHistory
				.where('walletPublicKey')
				.equals($activeWallet.publicKey)
				.reverse()
				.sortBy('timestamp');

			history = transfers;
		} catch (error) {
			console.error('Failed to load transaction history:', error);
		} finally {
			isLoading = false;
		}
	}

	function formatAmount(amount: number): string {
		return (amount / 1_000_000).toFixed(2);
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'confirmed':
				return '✓';
			case 'pending':
				return '⏳';
			case 'failed':
				return '✗';
			default:
				return '?';
		}
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'confirmed':
				return 'status-confirmed';
			case 'pending':
				return 'status-pending';
			case 'failed':
				return 'status-failed';
			default:
				return '';
		}
	}

	// Reactive: reload history when wallet changes
	$effect(() => {
		if ($activeWallet) {
			loadHistory();
		}
	});
</script>

<div class="transaction-history">
	<h3 class="history-header">Recent Transfers</h3>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading transactions...</p>
		</div>
	{:else if history.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📭</span>
			<p>No transactions yet</p>
			<span class="empty-hint">Your transfer history will appear here</span>
		</div>
	{:else}
		<div class="transactions-list">
			{#each history as tx}
				<div class="tx-item">
					<div class="tx-main">
						<div class="tx-info">
							<div class="tx-recipient">
								To: {tx.recipientName ||
									`${tx.recipientPublicKey.slice(0, 4)}...${tx.recipientPublicKey.slice(-4)}`}
							</div>
							<div class="tx-details">
								<span class="tx-date">{formatDate(tx.timestamp)}</span>
								<span class="tx-variance">Variance: {tx.variance}/255</span>
							</div>
						</div>
						<div class="tx-amount-status">
							<div class="tx-amount">-{formatAmount(tx.amount)} DC</div>
							<div class="tx-status {getStatusClass(tx.status)}">
								<span class="status-icon">{getStatusIcon(tx.status)}</span>
								<span class="status-text">{tx.status}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.transaction-history {
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.history-header {
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.loading-state p {
		color: #b4b4b4;
		font-size: 0.9rem;
		margin: 0;
	}

	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid rgba(107, 70, 255, 0.2);
		border-top-color: #6b46ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 0.5rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: white;
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.empty-hint {
		color: #8a8a9e;
		font-size: 0.85rem;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tx-item {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.tx-item:hover {
		background: rgba(107, 70, 255, 0.05);
		border-color: rgba(107, 70, 255, 0.4);
	}

	.tx-main {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.tx-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tx-recipient {
		color: white;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.tx-details {
		display: flex;
		gap: 1rem;
		font-size: 0.8rem;
		color: #8a8a9e;
	}

	.tx-variance {
		color: #6b46ff;
	}

	.tx-amount-status {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.tx-amount {
		color: #ff6b6b;
		font-size: 1rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
	}

	.tx-status {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.status-icon {
		font-size: 0.9rem;
	}

	.status-confirmed {
		background: rgba(74, 222, 128, 0.1);
		color: #4ade80;
	}

	.status-pending {
		background: rgba(251, 191, 36, 0.1);
		color: #fbbf24;
	}

	.status-failed {
		background: rgba(248, 113, 113, 0.1);
		color: #f87171;
	}

	@media (max-width: 480px) {
		.transaction-history {
			padding: 1rem;
		}

		.tx-main {
			flex-direction: column;
			gap: 0.75rem;
		}

		.tx-amount-status {
			align-items: flex-start;
			flex-direction: row;
			justify-content: space-between;
			width: 100%;
		}

		.tx-details {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
