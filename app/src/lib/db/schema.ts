import Dexie, { type EntityTable } from 'dexie';

/**
 * Wallet account stored in IndexedDB
 * Contains keypair and x25519 keys for encryption
 * Reference: tests/degen_cash.ts:27-33, 163-180
 */
export interface Wallet {
	id?: number;
	name: string; // Random generated name (e.g., "Brave Penguin")
	publicKey: string; // Base58 encoded
	secretKey: Uint8Array; // Full keypair secret (64 bytes)
	x25519PrivateKey: Uint8Array; // For decryption (32 bytes)
	x25519PublicKey: Uint8Array; // For shared secret (32 bytes)
	createdAt: Date;
	isActive: boolean; // Only one wallet active at a time
}

/**
 * Transfer history for tracking past transactions
 */
export interface TransferHistory {
	id?: number;
	walletPublicKey: string; // Sender wallet
	recipientPublicKey: string; // Receiver wallet
	recipientName?: string; // If known
	amount: number; // DC amount in base units (6 decimals)
	variance: number; // 0-255
	timestamp: Date;
	signature: string; // Transaction signature
	status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Known addresses for quick recipient selection
 * Populated when user sends to an address
 */
export interface KnownAddress {
	id?: number;
	publicKey: string;
	name: string; // User-set or generated
	lastUsed: Date;
}

/**
 * Dexie database for Degen Cash app
 * Stores embedded wallets, transfer history, and known addresses
 */
export class DegenCashDB extends Dexie {
	wallets!: EntityTable<Wallet, 'id'>;
	transferHistory!: EntityTable<TransferHistory, 'id'>;
	knownAddresses!: EntityTable<KnownAddress, 'id'>;

	constructor() {
		super('DegenCashDB');

		this.version(1).stores({
			wallets: '++id, publicKey, isActive',
			transferHistory: '++id, walletPublicKey, timestamp, status',
			knownAddresses: '++id, publicKey, lastUsed'
		});
	}
}

// Export singleton instance
export const db = new DegenCashDB();
