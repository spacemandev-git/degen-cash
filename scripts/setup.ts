#!/usr/bin/env tsx

/**
 * Setup script for Degen Cash
 * Initializes computation definitions, creates fake USDC mint, and initializes global DC mint
 *
 * Usage:
 *   bun run setup:localnet                              # Auto-generates keypair
 *   bun run setup:devnet --keypair ~/.config/solana/devnet.json
 *
 * Reference: tests/degen_cash.ts:104-216
 */

import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { DegenCash } from '../target/types/degen_cash';
import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import { createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';
import { randomBytes } from 'crypto';
import {
	getArciumEnv,
	getCompDefAccOffset,
	getArciumAccountBaseSeed,
	getArciumProgAddress,
	getMXEAccAddress,
	getMempoolAccAddress,
	getExecutingPoolAccAddress,
	getCompDefAccAddress,
	getComputationAccAddress,
	deserializeLE
} from '@arcium-hq/client';

// Load IDL
const idl = JSON.parse(
	fs.readFileSync('./target/idl/degen_cash.json', 'utf8')
) as anchor.Idl;

interface SetupConfig {
	network: 'localhost' | 'devnet';
	keypairPath?: string;
}

function parseArgs(): SetupConfig {
	const args = process.argv.slice(2);
	let network: 'localhost' | 'devnet' = 'localhost';
	let keypairPath: string | undefined;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--network' && args[i + 1]) {
			network = args[i + 1] as 'localhost' | 'devnet';
			i++;
		} else if (args[i] === '--keypair' && args[i + 1]) {
			keypairPath = args[i + 1];
			i++;
		}
	}

	return { network, keypairPath };
}

function readKeypairFromFile(path: string): Keypair {
	const file = fs.readFileSync(path, 'utf8');
	const secretKey = new Uint8Array(JSON.parse(file));
	return Keypair.fromSecretKey(secretKey);
}

async function initGlobalDCMintCompDef(
	program: Program<DegenCash>,
	owner: Keypair
): Promise<string> {
	const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
	const offset = getCompDefAccOffset('init_global_dc_mint');

	const compDefPDA = PublicKey.findProgramAddressSync(
		[baseSeedCompDefAcc, program.programId.toBuffer(), offset],
		getArciumProgAddress()
	)[0];

	// Check if already initialized
	try {
		await program.provider.connection.getAccountInfo(compDefPDA);
		console.log('  ✓ init_global_dc_mint comp def already exists');
		return '';
	} catch (e) {
		// Account doesn't exist, proceed with initialization
	}

	const sig = await program.methods
		.initGlobalDcMintCompDef()
		.accounts({
			compDefAccount: compDefPDA,
			payer: owner.publicKey,
			mxeAccount: getMXEAccAddress(program.programId)
		})
		.signers([owner])
		.rpc({ commitment: 'confirmed' });

	return sig;
}

async function initDepositCompDef(
	program: Program<DegenCash>,
	owner: Keypair
): Promise<string> {
	const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
	const offset = getCompDefAccOffset('deposit');

	const compDefPDA = PublicKey.findProgramAddressSync(
		[baseSeedCompDefAcc, program.programId.toBuffer(), offset],
		getArciumProgAddress()
	)[0];

	try {
		await program.provider.connection.getAccountInfo(compDefPDA);
		console.log('  ✓ deposit comp def already exists');
		return '';
	} catch (e) {
		// Proceed
	}

	const sig = await program.methods
		.initDepositCompDef()
		.accounts({
			compDefAccount: compDefPDA,
			payer: owner.publicKey,
			mxeAccount: getMXEAccAddress(program.programId)
		})
		.signers([owner])
		.rpc({ commitment: 'confirmed' });

	return sig;
}

async function initCreateDcTokenAccountCompDef(
	program: Program<DegenCash>,
	owner: Keypair
): Promise<string> {
	const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
	const offset = getCompDefAccOffset('init_user_dc_balance');

	const compDefPDA = PublicKey.findProgramAddressSync(
		[baseSeedCompDefAcc, program.programId.toBuffer(), offset],
		getArciumProgAddress()
	)[0];

	try {
		await program.provider.connection.getAccountInfo(compDefPDA);
		console.log('  ✓ create_dc_token_account comp def already exists');
		return '';
	} catch (e) {
		// Proceed
	}

	const sig = await program.methods
		.initCreateDcTokenAccountCompDef()
		.accounts({
			compDefAccount: compDefPDA,
			payer: owner.publicKey,
			mxeAccount: getMXEAccAddress(program.programId)
		})
		.signers([owner])
		.rpc({ commitment: 'confirmed' });

	return sig;
}

async function initTransferCompDef(
	program: Program<DegenCash>,
	owner: Keypair
): Promise<string> {
	const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
	const offset = getCompDefAccOffset('transfer');

	const compDefPDA = PublicKey.findProgramAddressSync(
		[baseSeedCompDefAcc, program.programId.toBuffer(), offset],
		getArciumProgAddress()
	)[0];

	try {
		await program.provider.connection.getAccountInfo(compDefPDA);
		console.log('  ✓ transfer comp def already exists');
		return '';
	} catch (e) {
		// Proceed
	}

	const sig = await program.methods
		.initTransferCompDef()
		.accounts({
			compDefAccount: compDefPDA,
			payer: owner.publicKey,
			mxeAccount: getMXEAccAddress(program.programId)
		})
		.signers([owner])
		.rpc({ commitment: 'confirmed' });

	return sig;
}

async function initWithdrawCompDef(
	program: Program<DegenCash>,
	owner: Keypair
): Promise<string> {
	const baseSeedCompDefAcc = getArciumAccountBaseSeed('ComputationDefinitionAccount');
	const offset = getCompDefAccOffset('withdraw');

	const compDefPDA = PublicKey.findProgramAddressSync(
		[baseSeedCompDefAcc, program.programId.toBuffer(), offset],
		getArciumProgAddress()
	)[0];

	try {
		await program.provider.connection.getAccountInfo(compDefPDA);
		console.log('  ✓ withdraw comp def already exists');
		return '';
	} catch (e) {
		// Proceed
	}

	const sig = await program.methods
		.initWithdrawCompDef()
		.accounts({
			compDefAccount: compDefPDA,
			payer: owner.publicKey,
			mxeAccount: getMXEAccAddress(program.programId)
		})
		.signers([owner])
		.rpc({ commitment: 'confirmed' });

	return sig;
}

async function main() {
	const config = parseArgs();
	console.log(`\n${'═'.repeat(60)}`);
	console.log(`  Degen Cash Setup - ${config.network.toUpperCase()}`);
	console.log(`${'═'.repeat(60)}\n`);

	// Load or generate owner keypair
	let owner: Keypair;
	if (config.network === 'localhost') {
		// For localhost, try to load from default Solana config or generate
		const defaultPath = `${os.homedir()}/.config/solana/id.json`;
		if (config.keypairPath) {
			owner = readKeypairFromFile(config.keypairPath);
			console.log(`✓ Loaded keypair from ${config.keypairPath}`);
		} else if (fs.existsSync(defaultPath)) {
			owner = readKeypairFromFile(defaultPath);
			console.log(`✓ Loaded keypair from ${defaultPath}`);
		} else {
			owner = Keypair.generate();
			console.log(`✓ Generated new keypair: ${owner.publicKey.toBase58()}`);
		}
	} else {
		// For devnet, require keypair path
		if (!config.keypairPath) {
			console.error('❌ Error: --keypair required for devnet setup');
			process.exit(1);
		}
		owner = readKeypairFromFile(config.keypairPath);
		console.log(`✓ Loaded keypair from ${config.keypairPath}`);
	}

	console.log(`  Owner: ${owner.publicKey.toBase58()}\n`);

	// Setup connection and provider
	const rpcUrl =
		config.network === 'localhost'
			? 'http://127.0.0.1:8899'
			: 'https://api.devnet.solana.com';
	const connection = new Connection(rpcUrl, 'confirmed');

	// Check balance
	const balance = await connection.getBalance(owner.publicKey);
	console.log(`  Balance: ${balance / 1e9} SOL`);
	if (balance < 1e9) {
		console.warn('⚠️  Warning: Low balance, may need airdrop\n');
		if (config.network === 'localhost') {
			console.log('  Requesting airdrop...');
			const sig = await connection.requestAirdrop(owner.publicKey, 2e9);
			await connection.confirmTransaction(sig);
			console.log('  ✓ Airdropped 2 SOL\n');
		}
	}

	const wallet = {
		publicKey: owner.publicKey,
		signTransaction: async (tx: any) => tx,
		signAllTransactions: async (txs: any) => txs
	} as any;

	const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
	anchor.setProvider(provider);

	// Get program ID from IDL
	const programId = new PublicKey(idl.address || idl.metadata?.address);
	const program = new Program(idl, provider) as unknown as Program<DegenCash>;

	console.log(`  Program ID: ${programId.toBase58()}\n`);

	// Get Arcium environment
	const arciumEnv = getArciumEnv();
	console.log(`  Arcium Cluster: ${arciumEnv.arciumClusterPubkey.toBase58()}\n`);

	// Step 1: Create fake USDC mint
	console.log(`${'─'.repeat(60)}`);
	console.log('  Step 1: Creating Fake USDC Mint');
	console.log(`${'─'.repeat(60)}\n`);

	let depositMint: PublicKey;
	let depositMintKeypair: Keypair;

	// Check if mint already exists in .env
	const envPath = './app/.env';
	let envContent = '';
	if (fs.existsSync(envPath)) {
		envContent = fs.readFileSync(envPath, 'utf8');
		const existingMint = envContent.match(/PUBLIC_DEPOSIT_MINT=(.+)/)?.[1];
		if (existingMint && existingMint.trim()) {
			try {
				depositMint = new PublicKey(existingMint.trim());
				const mintInfo = await connection.getAccountInfo(depositMint);
				if (mintInfo) {
					console.log(`  ✓ Using existing mint: ${depositMint.toBase58()}\n`);
					// We don't have the keypair, but we don't need it if mint exists
					depositMintKeypair = Keypair.generate(); // Dummy, won't be used
				} else {
					throw new Error('Mint not found');
				}
			} catch (e) {
				// Mint doesn't exist, create new one
				depositMintKeypair = Keypair.generate();
				depositMint = await createMint(
					connection,
					owner,
					owner.publicKey,
					owner.publicKey,
					6,
					depositMintKeypair
				);
				console.log(`  ✓ Created new mint: ${depositMint.toBase58()}\n`);
			}
		} else {
			depositMintKeypair = Keypair.generate();
			depositMint = await createMint(
				connection,
				owner,
				owner.publicKey,
				owner.publicKey,
				6,
				depositMintKeypair
			);
			console.log(`  ✓ Created new mint: ${depositMint.toBase58()}\n`);
		}
	} else {
		depositMintKeypair = Keypair.generate();
		depositMint = await createMint(
			connection,
			owner,
			owner.publicKey,
			owner.publicKey,
			6,
			depositMintKeypair
		);
		console.log(`  ✓ Created new mint: ${depositMint.toBase58()}\n`);
	}

	// Step 2: Initialize computation definitions
	console.log(`${'─'.repeat(60)}`);
	console.log('  Step 2: Initializing Computation Definitions');
	console.log(`${'─'.repeat(60)}\n`);

	try {
		await initGlobalDCMintCompDef(program, owner);
		await initDepositCompDef(program, owner);
		await initCreateDcTokenAccountCompDef(program, owner);
		await initTransferCompDef(program, owner);
		await initWithdrawCompDef(program, owner);
		console.log('\n  ✓ All computation definitions initialized\n');
	} catch (error) {
		console.error('❌ Error initializing comp defs:', error);
		process.exit(1);
	}

	// Step 3: Initialize global DC mint
	console.log(`${'─'.repeat(60)}`);
	console.log('  Step 3: Initializing Global DC Mint');
	console.log(`${'─'.repeat(60)}\n`);

	const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
		[Buffer.from('dc_global_mint')],
		programId
	);

	// Check if already initialized
	try {
		await program.account.dcGlobalMint.fetch(dcGlobalMintPDA);
		console.log('  ✓ Global DC mint already initialized\n');
	} catch (e) {
		// Not initialized, proceed
		const computationOffset = new anchor.BN(randomBytes(8), 'hex');
		const nonce = randomBytes(16);

		try {
			await program.methods
				.queueInitGlobalDcMint(
					computationOffset,
					new anchor.BN(deserializeLE(nonce).toString()),
					depositMint
				)
				.accounts({
					computationAccount: getComputationAccAddress(programId, computationOffset),
					clusterAccount: arciumEnv.arciumClusterPubkey,
					payer: owner.publicKey,
					mxeAccount: getMXEAccAddress(programId),
					mempoolAccount: getMempoolAccAddress(programId),
					executingPool: getExecutingPoolAccAddress(programId),
					compDefAccount: getCompDefAccAddress(
						programId,
						Buffer.from(getCompDefAccOffset('init_global_dc_mint')).readUInt32LE()
					),
					depositMint: depositMint,
					tokenProgram: TOKEN_PROGRAM_ID
				})
				.signers([owner])
				.rpc({ skipPreflight: false, commitment: 'confirmed' });

			console.log('  ⏳ Waiting for MPC computation to complete...');
			await new Promise((resolve) => setTimeout(resolve, 3000));

			console.log('  ✓ Global DC mint initialized\n');
		} catch (error) {
			console.error('❌ Error initializing global DC mint:', error);
			process.exit(1);
		}
	}

	// Step 4: Save to .env file
	console.log(`${'─'.repeat(60)}`);
	console.log('  Step 4: Saving Configuration');
	console.log(`${'─'.repeat(60)}\n`);

	// Update .env file
	const updates = {
		PRIVATE_SOLANA_RPC_URL: rpcUrl,
		PUBLIC_ARCIUM_CLUSTER_PUBKEY: arciumEnv.arciumClusterPubkey.toBase58(),
		PRIVATE_MINT_AUTHORITY_SECRET: JSON.stringify(Array.from(owner.secretKey)),
		PUBLIC_DEGEN_CASH_PROGRAM_ID: programId.toBase58(),
		PUBLIC_DEPOSIT_MINT: depositMint.toBase58(),
		PUBLIC_NETWORK: config.network
	};

	let newEnvContent = envContent || fs.readFileSync('./app/.env.example', 'utf8');

	for (const [key, value] of Object.entries(updates)) {
		const regex = new RegExp(`^${key}=.*$`, 'm');
		if (newEnvContent.match(regex)) {
			newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
		} else {
			newEnvContent += `\n${key}=${value}`;
		}
	}

	fs.writeFileSync(envPath, newEnvContent);
	console.log('  ✓ Configuration saved to app/.env\n');

	// Summary
	console.log(`${'═'.repeat(60)}`);
	console.log('  Setup Complete!');
	console.log(`${'═'.repeat(60)}\n`);

	console.log('Configuration:');
	console.log(`  Network:             ${config.network}`);
	console.log(`  RPC URL:             ${rpcUrl}`);
	console.log(`  Program ID:          ${programId.toBase58()}`);
	console.log(`  Deposit Mint (USDC): ${depositMint.toBase58()}`);
	console.log(`  Owner:               ${owner.publicKey.toBase58()}`);
	console.log(`  Arcium Cluster:      ${arciumEnv.arciumClusterPubkey.toBase58()}\n`);

	console.log('Next steps:');
	console.log('  1. cd app');
	console.log('  2. bun run dev');
	console.log('  3. Open http://localhost:5173\n');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
