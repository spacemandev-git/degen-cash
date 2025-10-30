import * as anchor from '@coral-xyz/anchor';
import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client';
import type { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

/**
 * Service for decrypting and formatting encrypted DC balances
 * Uses Arcium's RescueCipher with x25519 shared secrets
 * Reference: tests/degen_cash.ts:90-97
 */
export class BalanceService {
	private mxePublicKey: Uint8Array | null = null;

	/**
	 * Initialize and fetch MXE public key
	 * Must be called once before decrypting balances
	 *
	 * @param provider - Anchor provider
	 * @param programId - Degen Cash program ID
	 */
	async initialize(provider: AnchorProvider, programId: PublicKey): Promise<void> {
		this.mxePublicKey = await getMXEPublicKey(provider, programId);
	}

	/**
	 * Get MXE public key (cached)
	 * @throws Error if not initialized
	 */
	getMXEPublicKey(): Uint8Array {
		if (!this.mxePublicKey) {
			throw new Error('BalanceService not initialized. Call initialize() first.');
		}
		return this.mxePublicKey;
	}

	/**
	 * Decrypt DC balance from encrypted account data
	 * Reference: tests/degen_cash.ts:90-97
	 *
	 * @param dcAccount - DC user token account data from Anchor
	 * @param userX25519PrivateKey - User's x25519 private key
	 * @returns Decrypted balance as string (base units, 6 decimals)
	 */
	decryptBalance(dcAccount: any, userX25519PrivateKey: Uint8Array): string {
		if (!this.mxePublicKey) {
			throw new Error('BalanceService not initialized. Call initialize() first.');
		}

		// Compute shared secret between user and MXE
		const sharedSecret = x25519.getSharedSecret(userX25519PrivateKey, this.mxePublicKey);

		// Create cipher with shared secret
		const cipher = new RescueCipher(sharedSecret);

		// Convert nonce to little-endian bytes (16 bytes)
		const nonceBytes = new anchor.BN(dcAccount.amountNonce.toString()).toArrayLike(
			Buffer,
			'le',
			16
		);

		// Decrypt the balance
		const decryptedBalance = cipher.decrypt([dcAccount.amount], nonceBytes);

		return decryptedBalance.toString();
	}

	/**
	 * Format balance for display
	 * Converts from base units (6 decimals) to human-readable format
	 *
	 * @param balance - Balance in base units (string)
	 * @param decimals - Number of decimals (default 6)
	 * @param displayDecimals - Number of decimals to show (default 2)
	 * @returns Formatted balance string
	 */
	static formatBalance(
		balance: string,
		decimals: number = 6,
		displayDecimals: number = 2
	): string {
		const num = Number(balance) / Math.pow(10, decimals);
		return num.toFixed(displayDecimals);
	}

	/**
	 * Parse human-readable amount to base units
	 * Converts user input to base units for transactions
	 *
	 * @param amount - Amount in decimal format (e.g., "100.50")
	 * @param decimals - Number of decimals (default 6)
	 * @returns Amount in base units
	 */
	static parseAmount(amount: string | number, decimals: number = 6): number {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return Math.floor(num * Math.pow(10, decimals));
	}

	/**
	 * Validate amount is positive and has valid decimal places
	 *
	 * @param amount - Amount to validate
	 * @param decimals - Maximum decimals allowed (default 6)
	 * @returns true if valid
	 */
	static validateAmount(amount: string, decimals: number = 6): boolean {
		const num = parseFloat(amount);
		if (isNaN(num) || num <= 0) {
			return false;
		}

		// Check decimal places
		const parts = amount.split('.');
		if (parts.length > 1 && parts[1].length > decimals) {
			return false;
		}

		return true;
	}

	/**
	 * Format public key for display (shortened)
	 *
	 * @param publicKey - Public key to format
	 * @param chars - Number of characters to show on each end (default 4)
	 * @returns Shortened public key (e.g., "ABC1...XYZ9")
	 */
	static formatPublicKey(publicKey: string, chars: number = 4): string {
		if (publicKey.length <= chars * 2) {
			return publicKey;
		}
		return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`;
	}
}
