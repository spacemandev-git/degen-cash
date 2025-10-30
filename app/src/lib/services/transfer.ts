import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import {
	getCompDefAccOffset,
	getComputationAccAddress,
	getMXEAccAddress,
	getMempoolAccAddress,
	getExecutingPoolAccAddress,
	getCompDefAccAddress
} from '@arcium-hq/client';
import type { Program } from '@coral-xyz/anchor';
import type { DegenCash } from '../anchor/types/degen_cash';
import { PUBLIC_ARCIUM_CLUSTER_PUBKEY } from '$env/static/public';

/**
 * Transfer Service for DC peer-to-peer transfers with variance
 * Reference: tests/degen_cash.ts:344-371
 */
export class TransferService {
	/**
	 * Transfer DC between users with configurable variance
	 * @param program - Anchor program instance
	 * @param senderKeypair - Sender's keypair
	 * @param recipientPublicKey - Recipient's public key
	 * @param amount - Amount in DC (raw units, 6 decimals)
	 * @param variance - Privacy variance (0-255)
	 * @param depositMint - USDC/deposit mint address
	 * @returns Transaction signature
	 */
	static async transfer(
		program: Program<DegenCash>,
		senderKeypair: Keypair,
		recipientPublicKey: PublicKey,
		amount: number,
		variance: number,
		depositMint: PublicKey
	): Promise<string> {
		const arciumClusterPubkey = new PublicKey(PUBLIC_ARCIUM_CLUSTER_PUBKEY);
		const computationOffset = new anchor.BN(randomBytes(8), 'hex');

		// Derive PDAs
		const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
			[Buffer.from('dc_global_mint')],
			program.programId
		);

		const [senderDcTokenAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from('dc_user_token_account'), senderKeypair.publicKey.toBuffer()],
			program.programId
		);

		const [receiverDcTokenAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from('dc_user_token_account'), recipientPublicKey.toBuffer()],
			program.programId
		);

		// Get computation definition offset
		const compDefOffset = getCompDefAccOffset('transfer');

		// Queue transfer computation
		const signature = await program.methods
			.queueTransfer(
				computationOffset,
				new anchor.BN(amount),
				variance,
				recipientPublicKey
			)
			.accountsPartial({
				computationAccount: getComputationAccAddress(
					program.programId,
					computationOffset
				),
				clusterAccount: arciumClusterPubkey,
				payer: senderKeypair.publicKey,
				mxeAccount: getMXEAccAddress(program.programId),
				mempoolAccount: getMempoolAccAddress(program.programId),
				executingPool: getExecutingPoolAccAddress(program.programId),
				compDefAccount: getCompDefAccAddress(
					program.programId,
					Buffer.from(compDefOffset).readUInt32LE()
				),
				dcGlobalMintAccount: dcGlobalMintPDA,
				dcUserTokenAccount: senderDcTokenAccount,
				receiverDcUserTokenAccount: receiverDcTokenAccount,
				depositMint: depositMint
			})
			.signers([senderKeypair])
			.rpc({ skipPreflight: false, commitment: 'confirmed' });

		return signature;
	}

	/**
	 * Poll for transfer completion
	 * Waits optimistically for 2.5 seconds (similar to deposit/withdraw)
	 * @param maxWaitMs - Maximum wait time in milliseconds (default: 2500ms)
	 */
	static async pollForCompletion(maxWaitMs: number = 2500): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, maxWaitMs));
	}

	/**
	 * Calculate fee based on variance
	 * Fee in bps = 255 - variance
	 * @param variance - Variance value (0-255)
	 * @returns Fee as percentage string
	 */
	static calculateFeePercentage(variance: number): string {
		const feeBps = 255 - variance;
		return (feeBps / 100).toFixed(2);
	}

	/**
	 * Calculate maximum cost for a transfer (amount + max variance + fee)
	 * @param amount - Base transfer amount
	 * @param variance - Variance value (0-255)
	 * @returns Maximum possible cost
	 */
	static calculateMaxCost(amount: number, variance: number): number {
		const maxVarianceCost = amount * (variance / 255);
		const feeBps = 255 - variance;
		const maxFeeCost = amount * (feeBps / 255);
		return amount + maxVarianceCost + maxFeeCost;
	}

	/**
	 * Validate transfer amount and balance
	 * @param amount - Transfer amount
	 * @param variance - Variance value
	 * @param balance - User's current balance (raw units)
	 * @param maxTransfer - Maximum transfer limit (default: 1000 DC in raw units)
	 * @returns True if valid
	 */
	static validateTransfer(
		amount: number,
		variance: number,
		balance: number,
		maxTransfer: number = 1000 * 1_000_000
	): { valid: boolean; error?: string } {
		if (amount <= 0) {
			return { valid: false, error: 'Amount must be greater than 0' };
		}

		if (amount > maxTransfer) {
			return { valid: false, error: 'Amount exceeds 1000 DC limit per transaction' };
		}

		const maxCost = this.calculateMaxCost(amount, variance);
		if (maxCost > balance) {
			return { valid: false, error: 'Insufficient balance for transfer + variance + fee' };
		}

		return { valid: true };
	}
}
