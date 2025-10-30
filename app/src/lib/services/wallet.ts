import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { x25519 } from '@arcium-hq/client';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { db, type Wallet } from '$lib/db/schema';

/**
 * Wallet management service for embedded wallets
 * Handles wallet creation, import, and active wallet switching
 * Reference: tests/degen_cash.ts:163-180 for x25519 key derivation
 */
export class WalletService {
	/**
	 * Create new wallet with random funny name
	 * Derives x25519 keys for Arcium encryption
	 *
	 * @returns Newly created wallet
	 */
	static async createWallet(): Promise<Wallet> {
		const keypair = Keypair.generate();

		// Generate random funny name
		const name = uniqueNamesGenerator({
			dictionaries: [adjectives, animals],
			separator: ' ',
			style: 'capital',
			length: 2
		});

		// Derive x25519 keys from keypair signature
		// Reference: tests/degen_cash.ts:163-166
		const message = Buffer.from('dgn.cash');
		const signature = nacl.sign.detached(message, keypair.secretKey);
		const x25519PrivateKey = signature.slice(0, 32);
		const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

		const wallet: Wallet = {
			name,
			publicKey: keypair.publicKey.toBase58(),
			secretKey: keypair.secretKey,
			x25519PrivateKey,
			x25519PublicKey,
			createdAt: new Date(),
			isActive: true
		};

		// Deactivate all other wallets
		await db.wallets.where('isActive').equals(true).modify({ isActive: false });

		// Add new wallet to DB
		await db.wallets.add(wallet);

		return wallet;
	}

	/**
	 * Import wallet from secret key
	 *
	 * @param secretKey - Uint8Array secret key (64 bytes) or JSON array
	 * @param name - Optional custom name, otherwise generates random name
	 * @returns Imported wallet
	 */
	static async importWallet(
		secretKey: Uint8Array | number[],
		name?: string
	): Promise<Wallet> {
		// Convert to Uint8Array if JSON array
		const secretKeyBytes =
			secretKey instanceof Uint8Array ? secretKey : new Uint8Array(secretKey);

		const keypair = Keypair.fromSecretKey(secretKeyBytes);

		// Generate or use provided name
		if (!name) {
			name = uniqueNamesGenerator({
				dictionaries: [adjectives, animals],
				separator: ' ',
				style: 'capital',
				length: 2
			});
		}

		// Derive x25519 keys
		const message = Buffer.from('dgn.cash');
		const signature = nacl.sign.detached(message, keypair.secretKey);
		const x25519PrivateKey = signature.slice(0, 32);
		const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

		const wallet: Wallet = {
			name,
			publicKey: keypair.publicKey.toBase58(),
			secretKey: keypair.secretKey,
			x25519PrivateKey,
			x25519PublicKey,
			createdAt: new Date(),
			isActive: true
		};

		// Deactivate all other wallets
		await db.wallets.where('isActive').equals(true).modify({ isActive: false });

		// Add wallet to DB
		await db.wallets.add(wallet);

		return wallet;
	}

	/**
	 * Get currently active wallet
	 *
	 * @returns Active wallet or undefined if none
	 */
	static async getActiveWallet(): Promise<Wallet | undefined> {
		return await db.wallets.where('isActive').equals(true).first();
	}

	/**
	 * Switch to a different wallet by public key
	 *
	 * @param publicKey - Base58 public key of wallet to activate
	 */
	static async setActiveWallet(publicKey: string): Promise<void> {
		// Deactivate all wallets
		await db.wallets.where('isActive').equals(true).modify({ isActive: false });

		// Activate target wallet
		await db.wallets.where('publicKey').equals(publicKey).modify({ isActive: true });
	}

	/**
	 * Get all wallets
	 *
	 * @returns Array of all wallets, ordered by creation date (newest first)
	 */
	static async getAllWallets(): Promise<Wallet[]> {
		return await db.wallets.reverse().sortBy('createdAt');
	}

	/**
	 * Get wallet by public key
	 *
	 * @param publicKey - Base58 public key
	 * @returns Wallet or undefined
	 */
	static async getWalletByPublicKey(publicKey: string): Promise<Wallet | undefined> {
		return await db.wallets.where('publicKey').equals(publicKey).first();
	}

	/**
	 * Delete wallet by public key
	 * Note: Cannot delete active wallet
	 *
	 * @param publicKey - Base58 public key
	 * @throws Error if trying to delete active wallet
	 */
	static async deleteWallet(publicKey: string): Promise<void> {
		const wallet = await this.getWalletByPublicKey(publicKey);
		if (wallet?.isActive) {
			throw new Error('Cannot delete active wallet');
		}

		await db.wallets.where('publicKey').equals(publicKey).delete();
	}

	/**
	 * Convert wallet to Keypair for signing transactions
	 *
	 * @param wallet - Wallet object from DB
	 * @returns Solana Keypair
	 */
	static walletToKeypair(wallet: Wallet): Keypair {
		return Keypair.fromSecretKey(wallet.secretKey);
	}

	/**
	 * Export wallet secret key as JSON array (for backup)
	 *
	 * @param wallet - Wallet to export
	 * @returns JSON string of secret key array
	 */
	static exportSecretKey(wallet: Wallet): string {
		return JSON.stringify(Array.from(wallet.secretKey));
	}
}
