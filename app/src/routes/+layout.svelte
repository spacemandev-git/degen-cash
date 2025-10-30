<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { WalletService } from '$lib/services/wallet';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	// Route guard: redirect to onboarding if no wallet exists
	onMount(async () => {
		// Skip check if already on onboarding page
		if ($page.url.pathname === '/onboarding') {
			return;
		}

		// Check if user has any wallets
		const wallet = await WalletService.getActiveWallet();

		// If no wallet, redirect to onboarding
		if (!wallet) {
			await goto('/onboarding');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Toast notifications -->
<Toaster position="top-center" theme="dark" richColors closeButton />

{@render children?.()}
