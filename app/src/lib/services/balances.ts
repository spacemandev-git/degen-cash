import { get } from 'svelte/store';
import { activeWallet, dcBalance, usdcBalance, solBalance, isLoadingBalances } from '$lib/stores/wallet';
import { ProgramService } from './program';
import { BalanceService } from './balance';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

/**
 * Service for fetching and updating wallet balances
 * Manages DC (encrypted), USDC (SPL token), and SOL balances
 */
export class BalanceFetchService {
	private programService: ProgramService;
	private balanceService: BalanceService;
	private depositMint: PublicKey;
	private pollInterval: number | null = null;

	constructor(programService: ProgramService, depositMintAddress: string) {
		this.programService = programService;
		this.balanceService = new BalanceService();
		this.depositMint = new PublicKey(depositMintAddress);
	}

	/**
	 * Initialize the balance service (fetch MXE public key)
	 */
	async initialize(): Promise<void> {
		const provider = this.programService.getProgram().provider as any;
		await this.balanceService.initialize(provider, this.programService.programId);
	}

	/**
	 * Fetch DC balance (encrypted, then decrypt)
	 * Reference: tests/degen_cash.ts:90-97
	 */
	async fetchDCBalance(): Promise<void> {
		const wallet = get(activeWallet);
		if (!wallet) return;

		try {
			const dcAccount = await this.programService.getDCTokenAccount(
				new PublicKey(wallet.publicKey)
			);

			if (dcAccount) {
				const decrypted = this.balanceService.decryptBalance(
					dcAccount,
					wallet.x25519PrivateKey
				);
				dcBalance.set(decrypted);
			} else {
				dcBalance.set('0');
			}
		} catch (error) {
			console.error('Error fetching DC balance:', error);
			dcBalance.set('0');
		}
	}

	/**
	 * Fetch USDC balance from SPL token account
	 * Reference: tests/degen_cash.ts:99-102
	 */
	async fetchUSDCBalance(): Promise<void> {
		const wallet = get(activeWallet);
		if (!wallet) return;

		try {
			const connection = this.programService.getConnection();
			const userPublicKey = new PublicKey(wallet.publicKey);

			// Get ATA (associated token account)
			const ata = await getAssociatedTokenAddress(this.depositMint, userPublicKey);

			const account = await getAccount(connection, ata);
			usdcBalance.set(account.amount.toString());
		} catch (error) {
			// Account doesn't exist or error
			usdcBalance.set('0');
		}
	}

	/**
	 * Fetch SOL balance
	 */
	async fetchSOLBalance(): Promise<void> {
		const wallet = get(activeWallet);
		if (!wallet) return;

		try {
			const balance = await this.programService.getSOLBalance(new PublicKey(wallet.publicKey));
			solBalance.set(balance);
		} catch (error) {
			console.error('Error fetching SOL balance:', error);
			solBalance.set(0);
		}
	}

	/**
	 * Fetch all balances
	 */
	async fetchAllBalances(): Promise<void> {
		isLoadingBalances.set(true);
		try {
			await Promise.all([
				this.fetchDCBalance(),
				this.fetchUSDCBalance(),
				this.fetchSOLBalance()
			]);
		} finally {
			isLoadingBalances.set(false);
		}
	}

	/**
	 * Start polling balances every N seconds
	 * @param intervalSeconds - Polling interval in seconds (default 5)
	 */
	startPolling(intervalSeconds: number = 5): void {
		// Clear existing interval if any
		this.stopPolling();

		// Fetch immediately
		this.fetchAllBalances();

		// Set up interval
		this.pollInterval = window.setInterval(() => {
			this.fetchAllBalances();
		}, intervalSeconds * 1000);
	}

	/**
	 * Stop polling balances
	 */
	stopPolling(): void {
		if (this.pollInterval !== null) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}

	/**
	 * Get MXE public key (for decryption)
	 * @returns MXE public key or null if not initialized
	 */
	getMxePublicKey(): Uint8Array | null {
		try {
			return this.balanceService.getMXEPublicKey();
		} catch {
			return null;
		}
	}
}
