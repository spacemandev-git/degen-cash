import * as anchor from '@coral-xyz/anchor';
import { Program, type AnchorProvider } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import type { DegenCash } from '$lib/anchor/types/degen_cash';
import idlJson from '$lib/anchor/idl/degen_cash.json';

/**
 * Service for interacting with the Degen Cash Anchor program
 * Handles program initialization and account fetching
 */
export class ProgramService {
	private connection: Connection;
	private program: Program<DegenCash>;
	public programId: PublicKey;

	/**
	 * Create a new ProgramService instance
	 *
	 * @param rpcEndpoint - RPC endpoint URL (use /api/rpc for backend proxy)
	 * @param programId - Degen Cash program ID from env
	 */
	constructor(rpcEndpoint: string, programId: string) {
		this.connection = new Connection(rpcEndpoint, 'confirmed');
		this.programId = new PublicKey(programId);

		// Create a dummy wallet for the provider (actual signing done per-transaction)
		const dummyWallet = {
			publicKey: Keypair.generate().publicKey,
			signTransaction: async (tx: any) => tx,
			signAllTransactions: async (txs: any) => txs
		};

		const provider = new AnchorProvider(this.connection, dummyWallet as any, {
			commitment: 'confirmed'
		});

		// Initialize program with IDL
		this.program = new Program(
			idlJson as anchor.Idl,
			provider
		) as unknown as Program<DegenCash>;
	}

	/**
	 * Get the Anchor program instance
	 */
	getProgram(): Program<DegenCash> {
		return this.program;
	}

	/**
	 * Get the connection instance
	 */
	getConnection(): Connection {
		return this.connection;
	}

	/**
	 * Get DC user token account PDA
	 * Reference: tests/degen_cash.ts:168-171
	 *
	 * @param owner - User's public key
	 * @returns DC token account PDA
	 */
	getDCTokenAccountPDA(owner: PublicKey): PublicKey {
		const [dcTokenAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from('dc_user_token_account'), owner.toBuffer()],
			this.programId
		);
		return dcTokenAccount;
	}

	/**
	 * Fetch DC user token account
	 *
	 * @param owner - User's public key
	 * @returns DC token account data or null if doesn't exist
	 */
	async getDCTokenAccount(owner: PublicKey) {
		const dcTokenAccountPDA = this.getDCTokenAccountPDA(owner);

		try {
			return await this.program.account.dcUserTokenAccount.fetch(dcTokenAccountPDA);
		} catch (error) {
			// Account doesn't exist
			return null;
		}
	}

	/**
	 * Check if DC account exists for user
	 *
	 * @param owner - User's public key
	 * @returns true if account exists
	 */
	async dcAccountExists(owner: PublicKey): Promise<boolean> {
		const account = await this.getDCTokenAccount(owner);
		return account !== null;
	}

	/**
	 * Get global DC mint PDA
	 * Reference: tests/degen_cash.ts:339-342
	 *
	 * @returns Global DC mint PDA
	 */
	getGlobalDCMintPDA(): PublicKey {
		const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
			[Buffer.from('dc_global_mint')],
			this.programId
		);
		return dcGlobalMintPDA;
	}

	/**
	 * Fetch global DC mint account
	 *
	 * @returns Global DC mint data or null
	 */
	async getGlobalDCMint() {
		const dcGlobalMintPDA = this.getGlobalDCMintPDA();

		try {
			return await this.program.account.dcGlobalMint.fetch(dcGlobalMintPDA);
		} catch (error) {
			return null;
		}
	}

	/**
	 * Get SOL balance for an address
	 *
	 * @param publicKey - Public key to check
	 * @returns Balance in lamports
	 */
	async getSOLBalance(publicKey: PublicKey): Promise<number> {
		return await this.connection.getBalance(publicKey);
	}

	/**
	 * Request SOL airdrop (localhost only)
	 *
	 * @param publicKey - Recipient public key
	 * @param amount - Amount in SOL
	 * @returns Transaction signature
	 */
	async requestAirdrop(publicKey: PublicKey, amount: number): Promise<string> {
		const signature = await this.connection.requestAirdrop(
			publicKey,
			amount * 1_000_000_000
		);
		await this.connection.confirmTransaction(signature);
		return signature;
	}
}
