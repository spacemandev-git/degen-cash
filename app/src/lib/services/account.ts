import { ProgramService } from './program';
import { PublicKey, Keypair } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import * as anchor from '@coral-xyz/anchor';
import {
	getCompDefAccOffset,
	getComputationAccAddress,
	getMXEAccAddress,
	getMempoolAccAddress,
	getExecutingPoolAccAddress,
	getCompDefAccAddress,
	deserializeLE
} from '@arcium-hq/client';
import { PUBLIC_ARCIUM_CLUSTER_PUBKEY } from '$env/static/public';

/**
 * Service for managing DC token account creation
 * Ensures user has a DC account before performing transactions
 * Reference: tests/degen_cash.ts:218-250
 */
export class AccountService {
	/**
	 * Check if user has DC account, create if not
	 *
	 * @param programService - Program service instance
	 * @param userKeypair - User's keypair for signing
	 * @param x25519PublicKey - User's x25519 public key for encryption
	 * @param onProgress - Optional callback for progress updates
	 * @returns true if account exists or was created successfully
	 */
	static async ensureDCAccount(
		programService: ProgramService,
		userKeypair: Keypair,
		x25519PublicKey: Uint8Array,
		onProgress?: (message: string) => void
	): Promise<boolean> {
		const program = programService.getProgram();
		const userPublicKey = userKeypair.publicKey;

		// Check if account already exists
		onProgress?.('Checking for DC account...');
		const exists = await programService.dcAccountExists(userPublicKey);

		if (exists) {
			onProgress?.('DC account found');
			return true;
		}

		// Account doesn't exist, create it
		onProgress?.('Creating DC account...');

		try {
			const arciumClusterPubkey = new PublicKey(PUBLIC_ARCIUM_CLUSTER_PUBKEY);
			const computationOffset = new anchor.BN(randomBytes(8), 'hex');
			const nonce = randomBytes(16);

			await program.methods
				.queueCreateDcTokenAccount(
					computationOffset,
					Array.from(x25519PublicKey),
					new anchor.BN(deserializeLE(nonce).toString())
				)
				.accounts({
					computationAccount: getComputationAccAddress(program.programId, computationOffset),
					clusterAccount: arciumClusterPubkey,
					payer: userPublicKey,
					mxeAccount: getMXEAccAddress(program.programId),
					mempoolAccount: getMempoolAccAddress(program.programId),
					executingPool: getExecutingPoolAccAddress(program.programId),
					compDefAccount: getCompDefAccAddress(
						program.programId,
						Buffer.from(getCompDefAccOffset('init_user_dc_balance')).readUInt32LE()
					)
				})
				.signers([userKeypair])
				.rpc({ skipPreflight: false, commitment: 'confirmed' });

			// Poll for account creation
			onProgress?.('Waiting for MPC computation...');
			await this.pollForAccountCreation(programService, userPublicKey, 20, onProgress);

			onProgress?.('DC account created successfully');
			return true;
		} catch (error) {
			console.error('Failed to create DC account:', error);
			throw new Error('Failed to create DC account: ' + (error as Error).message);
		}
	}

	/**
	 * Poll for DC account creation (max attempts)
	 *
	 * @param programService - Program service instance
	 * @param publicKey - User's public key
	 * @param maxAttempts - Maximum polling attempts (default 20)
	 * @param onProgress - Optional progress callback
	 */
	private static async pollForAccountCreation(
		programService: ProgramService,
		publicKey: PublicKey,
		maxAttempts: number = 20,
		onProgress?: (message: string) => void
	): Promise<void> {
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((resolve) => setTimeout(resolve, 500));

			const exists = await programService.dcAccountExists(publicKey);
			if (exists) {
				return;
			}

			if (i % 4 === 0 && i > 0) {
				onProgress?.(`Still waiting... (${i}/${maxAttempts})`);
			}
		}

		throw new Error('DC account creation timed out. Please try again.');
	}

	/**
	 * Check if user has DC account (convenience method)
	 *
	 * @param programService - Program service instance
	 * @param publicKey - User's public key
	 * @returns true if account exists
	 */
	static async hasDCAccount(
		programService: ProgramService,
		publicKey: PublicKey
	): Promise<boolean> {
		return await programService.dcAccountExists(publicKey);
	}
}
