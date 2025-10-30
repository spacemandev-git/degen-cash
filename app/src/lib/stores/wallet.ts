import { writable, derived } from 'svelte/store';
import type { Wallet } from '$lib/db/schema';

/**
 * Svelte stores for wallet state and balances
 * Provides reactive state management across components
 */

// Active wallet
export const activeWallet = writable<Wallet | null>(null);

// Balances (in base units, 6 decimals)
export const dcBalance = writable<string>('0');
export const usdcBalance = writable<string>('0');
export const solBalance = writable<number>(0);

// Loading states
export const isLoadingBalances = writable<boolean>(false);
export const isLoadingTransaction = writable<boolean>(false);

// Derived formatted balances (for display)
export const formattedDCBalance = derived(dcBalance, ($balance) => {
	const num = Number($balance) / 1_000_000;
	return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

export const formattedUSDCBalance = derived(usdcBalance, ($balance) => {
	const num = Number($balance) / 1_000_000;
	return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

export const formattedSOLBalance = derived(solBalance, ($balance) => {
	const num = $balance / 1_000_000_000;
	return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
});

// Helper to reset all balances
export function resetBalances() {
	dcBalance.set('0');
	usdcBalance.set('0');
	solBalance.set(0);
}
