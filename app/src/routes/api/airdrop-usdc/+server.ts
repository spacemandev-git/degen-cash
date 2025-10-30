import {
	PRIVATE_SOLANA_RPC_URL,
	PRIVATE_MINT_AUTHORITY_SECRET,
	PUBLIC_DEPOSIT_MINT,
	PUBLIC_NETWORK
} from '$env/static/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

/**
 * Backend endpoint to airdrop fake USDC (localhost/devnet only)
 * Keeps mint authority secret on backend
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Only allow on localhost or devnet
		if (PUBLIC_NETWORK !== 'localhost' && PUBLIC_NETWORK !== 'devnet') {
			return json({ error: 'Airdrops not available on this network' }, { status: 403 });
		}

		const { publicKey, amount = 10000 } = await request.json();

		if (!publicKey) {
			return json({ error: 'Missing publicKey' }, { status: 400 });
		}

		if (!PRIVATE_MINT_AUTHORITY_SECRET || !PUBLIC_DEPOSIT_MINT) {
			return json({ error: 'Server not configured for airdrops' }, { status: 500 });
		}

		// Parse mint authority keypair
		const mintAuthority = Keypair.fromSecretKey(
			new Uint8Array(JSON.parse(PRIVATE_MINT_AUTHORITY_SECRET))
		);

		const connection = new Connection(PRIVATE_SOLANA_RPC_URL, 'confirmed');
		const depositMint = new PublicKey(PUBLIC_DEPOSIT_MINT);
		const userPublicKey = new PublicKey(publicKey);

		// Get or create user's ATA
		const ata = await getOrCreateAssociatedTokenAccount(
			connection,
			mintAuthority,
			depositMint,
			userPublicKey
		);

		// Mint USDC to user (6 decimals)
		const signature = await mintTo(
			connection,
			mintAuthority,
			depositMint,
			ata.address,
			mintAuthority,
			amount * 1_000_000
		);

		return json({
			success: true,
			signature,
			amount,
			ata: ata.address.toBase58()
		});
	} catch (error) {
		console.error('Airdrop USDC error:', error);
		return json({ error: 'Airdrop failed', details: (error as Error).message }, { status: 500 });
	}
};
