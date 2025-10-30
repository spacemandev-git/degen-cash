import { PublicKey } from '@solana/web3.js';
import { ProgramService } from './program';

/**
 * Airdrop service for SOL and USDC
 * SOL: Direct airdrop via RPC (localhost only)
 * USDC: Backend endpoint that mints fake USDC (localhost/devnet only)
 */
export class AirdropService {
	private programService: ProgramService;
	private network: string;

	constructor(programService: ProgramService, network: string) {
		this.programService = programService;
		this.network = network;
	}

	/**
	 * Airdrop SOL (localhost only)
	 * @param publicKey - Recipient public key
	 * @param amount - Amount in SOL (default 1)
	 * @returns Transaction signature
	 */
	async airdropSOL(publicKey: PublicKey, amount: number = 1): Promise<string> {
		if (this.network !== 'localhost') {
			throw new Error('SOL airdrops only available on localhost');
		}

		return await this.programService.requestAirdrop(publicKey, amount);
	}

	/**
	 * Airdrop fake USDC via backend endpoint
	 * Reference: tests/degen_cash.ts:147-161
	 *
	 * @param publicKey - Recipient public key
	 * @param amount - Amount in USDC (default 10000)
	 * @returns Transaction signature
	 */
	async airdropUSDC(publicKey: PublicKey, amount: number = 10000): Promise<string> {
		if (this.network !== 'localhost' && this.network !== 'devnet') {
			throw new Error('USDC airdrops only available on localhost/devnet');
		}

		const response = await fetch('/api/airdrop-usdc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				publicKey: publicKey.toBase58(),
				amount
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Airdrop failed');
		}

		const data = await response.json();
		return data.signature;
	}
}
