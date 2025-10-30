<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { activeWallet } from '$lib/stores/wallet';
	import { toast } from 'svelte-sonner';
	import QRCode from 'qrcode';

	let qrCodeDataUrl = $state('');
	let copied = $state(false);

	onMount(async () => {
		if (!$activeWallet) {
			goto('/');
			return;
		}

		// Generate QR code
		try {
			qrCodeDataUrl = await QRCode.toDataURL($activeWallet.publicKey, {
				width: 300,
				margin: 2,
				color: {
					dark: '#6b46ff',
					light: '#ffffff'
				}
			});
		} catch (error) {
			console.error('Failed to generate QR code:', error);
			toast.error('Failed to generate QR code');
		}
	});

	async function copyAddress() {
		if (!$activeWallet) return;

		try {
			await navigator.clipboard.writeText($activeWallet.publicKey);
			copied = true;
			toast.success('Address copied to clipboard!');

			// Reset copied state after 2 seconds
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy address:', error);
			toast.error('Failed to copy address');
		}
	}
</script>

<div class="receive-container">
	<!-- Header -->
	<div class="header">
		<button class="back-btn" on:click={() => goto('/')}>
			<span>←</span>
		</button>
		<h1>Receive DC</h1>
		<div></div>
	</div>

	<!-- Instruction -->
	<div class="instruction">
		<p>Share your wallet address to receive DC tokens</p>
	</div>

	<!-- QR Code -->
	<div class="qr-section">
		{#if qrCodeDataUrl}
			<div class="qr-card">
				<img src={qrCodeDataUrl} alt="Wallet QR Code" class="qr-image" />
			</div>
		{:else}
			<div class="qr-card loading">
				<div class="spinner"></div>
				<p>Generating QR code...</p>
			</div>
		{/if}
	</div>

	<!-- Wallet Address -->
	{#if $activeWallet}
		<div class="address-section">
			<div class="address-label">Your Wallet Address</div>
			<div class="address-display">
				<code class="address-text">{$activeWallet.publicKey}</code>
			</div>
		</div>
	{/if}

	<!-- Copy Button -->
	<button class="copy-btn" on:click={copyAddress} disabled={!$activeWallet}>
		{#if copied}
			<span class="icon">✓</span>
			<span>Copied!</span>
		{:else}
			<span class="icon">📋</span>
			<span>Copy Address</span>
		{/if}
	</button>

	<!-- Info Card -->
	<div class="info-card">
		<div class="info-icon">ℹ️</div>
		<div class="info-text">
			<strong>How to use:</strong><br />
			1. Show the QR code for scanning, or<br />
			2. Copy and share your wallet address<br />
			3. Others can send DC tokens to this address
		</div>
	</div>
</div>

<style>
	.receive-container {
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
		margin-bottom: 1.5rem;
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

	.instruction {
		text-align: center;
		margin-bottom: 2rem;
	}

	.instruction p {
		color: #b4b4b4;
		font-size: 0.95rem;
		margin: 0;
	}

	.qr-section {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.qr-card {
		background: white;
		border-radius: 1.5rem;
		padding: 1.5rem;
		box-shadow: 0 10px 40px rgba(107, 70, 255, 0.2);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.qr-card.loading {
		min-height: 300px;
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		gap: 1rem;
	}

	.qr-card.loading p {
		color: #b4b4b4;
		font-size: 0.9rem;
	}

	.qr-image {
		width: 300px;
		height: 300px;
		border-radius: 0.5rem;
	}

	.address-section {
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.address-label {
		font-size: 0.85rem;
		color: #b4b4b4;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.address-display {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		overflow: hidden;
	}

	.address-text {
		color: #6b46ff;
		font-size: 0.85rem;
		font-family: 'Courier New', monospace;
		word-break: break-all;
		line-height: 1.6;
		display: block;
	}

	.copy-btn {
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		border: none;
		border-radius: 0.75rem;
		padding: 1.25rem;
		color: white;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.copy-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(107, 70, 255, 0.3);
	}

	.copy-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.copy-btn .icon {
		font-size: 1.25rem;
	}

	.info-card {
		background: rgba(107, 70, 255, 0.05);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		gap: 1rem;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.info-text {
		color: #b4b4b4;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.info-text strong {
		color: white;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(107, 70, 255, 0.2);
		border-top-color: #6b46ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.receive-container {
			padding: 1.5rem 1rem;
		}

		.qr-image {
			width: 250px;
			height: 250px;
		}

		.qr-card {
			padding: 1rem;
		}

		.address-text {
			font-size: 0.75rem;
		}

		.info-text {
			font-size: 0.85rem;
		}
	}
</style>
