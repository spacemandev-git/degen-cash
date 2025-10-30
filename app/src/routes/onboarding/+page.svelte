<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { WalletService } from '$lib/services/wallet';
	import { toast } from 'svelte-sonner';

	let importing = false;
	let secretKeyInput = '';
	let customName = '';
	let isLoading = false;

	async function createWallet() {
		isLoading = true;
		try {
			const wallet = await WalletService.createWallet();
			toast.success(`Wallet created: ${wallet.name}`);
			await goto('/');
		} catch (error) {
			console.error('Create wallet error:', error);
			toast.error('Failed to create wallet');
		} finally {
			isLoading = false;
		}
	}

	async function importWallet() {
		if (!secretKeyInput.trim()) {
			toast.error('Please paste your secret key');
			return;
		}

		isLoading = true;
		try {
			// Parse secret key (support both JSON array and comma-separated)
			let secretKey: number[];

			try {
				secretKey = JSON.parse(secretKeyInput);
			} catch {
				// Try parsing as comma-separated numbers
				secretKey = secretKeyInput
					.split(',')
					.map((s) => parseInt(s.trim()))
					.filter((n) => !isNaN(n));
			}

			if (!Array.isArray(secretKey) || secretKey.length !== 64) {
				toast.error('Invalid secret key format. Expected 64-byte array.');
				return;
			}

			const wallet = await WalletService.importWallet(secretKey, customName || undefined);
			toast.success(`Wallet imported: ${wallet.name}`);
			await goto('/');
		} catch (error) {
			console.error('Import wallet error:', error);
			toast.error('Failed to import wallet. Check your secret key format.');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="onboarding-container">
	<div class="onboarding-card">
		<!-- Logo/Title -->
		<div class="header">
			<div class="logo">
				<div class="logo-icon">DC</div>
			</div>
			<h1>Degen Cash</h1>
			<p class="tagline">Privacy-Preserving Payments</p>
		</div>

		{#if !importing}
			<!-- Create Wallet Flow -->
			<div class="actions">
				<button class="btn-primary" on:click={createWallet} disabled={isLoading}>
					{#if isLoading}
						<span class="spinner"></span>
						Creating...
					{:else}
						Create New Wallet
					{/if}
				</button>

				<button class="btn-secondary" on:click={() => (importing = true)} disabled={isLoading}>
					Import Existing Wallet
				</button>
			</div>
		{:else}
			<!-- Import Wallet Flow -->
			<div class="import-form">
				<button class="btn-back" on:click={() => (importing = false)}>← Back</button>

				<h2>Import Wallet</h2>
				<p class="import-description">
					Paste your 64-byte secret key as a JSON array or comma-separated numbers
				</p>

				<div class="form-group">
					<label for="name">Wallet Name (Optional)</label>
					<input
						id="name"
						type="text"
						bind:value={customName}
						placeholder="Brave Penguin"
						disabled={isLoading}
					/>
				</div>

				<div class="form-group">
					<label for="secretKey">Secret Key</label>
					<textarea
						id="secretKey"
						bind:value={secretKeyInput}
						placeholder="[1,2,3,4,5,6,7,8,9,10,...]"
						rows="6"
						disabled={isLoading}
					></textarea>
				</div>

				<button class="btn-primary" on:click={importWallet} disabled={isLoading}>
					{#if isLoading}
						<span class="spinner"></span>
						Importing...
					{:else}
						Import Wallet
					{/if}
				</button>
			</div>
		{/if}

		<!-- Footer -->
		<div class="footer">
			<p class="disclaimer">
				⚠️ This is a demo app with embedded wallets stored in your browser. For production use,
				please use a secure wallet.
			</p>
		</div>
	</div>
</div>

<style>
	.onboarding-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
		padding: 1rem;
	}

	.onboarding-card {
		background: rgba(26, 26, 46, 0.8);
		border: 1px solid rgba(107, 70, 255, 0.2);
		border-radius: 1.5rem;
		padding: 3rem 2rem;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(107, 70, 255, 0.1);
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.logo {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.logo-icon {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
		color: white;
		box-shadow: 0 10px 30px rgba(107, 70, 255, 0.3);
	}

	h1 {
		font-size: 2rem;
		font-weight: bold;
		color: white;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.tagline {
		color: #b4b4b4;
		font-size: 0.9rem;
		margin: 0;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.btn-primary {
		width: 100%;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #6b46ff 0%, #3d2aff 100%);
		border: none;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(107, 70, 255, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		width: 100%;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #6b46ff;
		background: transparent;
		border: 2px solid #6b46ff;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(107, 70, 255, 0.1);
		transform: translateY(-2px);
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.import-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.btn-back {
		align-self: flex-start;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		color: #b4b4b4;
		background: transparent;
		border: 1px solid rgba(180, 180, 180, 0.3);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-back:hover {
		color: white;
		border-color: rgba(180, 180, 180, 0.6);
	}

	h2 {
		font-size: 1.5rem;
		color: white;
		margin: 0;
	}

	.import-description {
		font-size: 0.85rem;
		color: #b4b4b4;
		margin: -0.5rem 0 0 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.9rem;
		font-weight: 600;
		color: white;
	}

	input,
	textarea {
		padding: 0.75rem;
		font-size: 0.9rem;
		color: white;
		background: rgba(15, 15, 30, 0.5);
		border: 1px solid rgba(107, 70, 255, 0.3);
		border-radius: 0.5rem;
		outline: none;
		transition: all 0.2s ease;
		font-family: 'Courier New', monospace;
	}

	input:focus,
	textarea:focus {
		border-color: #6b46ff;
		box-shadow: 0 0 0 3px rgba(107, 70, 255, 0.1);
	}

	input:disabled,
	textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	input::placeholder,
	textarea::placeholder {
		color: #666;
	}

	.footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(107, 70, 255, 0.2);
	}

	.disclaimer {
		font-size: 0.75rem;
		color: #b4b4b4;
		text-align: center;
		margin: 0;
		line-height: 1.4;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.onboarding-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.logo-icon {
			width: 60px;
			height: 60px;
			font-size: 1.5rem;
		}
	}
</style>
