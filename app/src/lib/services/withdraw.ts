import { ProgramService } from './program';
import { Keypair, PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import * as anchor from '@coral-xyz/anchor';
import {
  getCompDefAccOffset,
  getComputationAccAddress,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getCompDefAccAddress,
  x25519,
  RescueCipher,
} from '@arcium-hq/client';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { BalanceService } from './balance';
import { PUBLIC_ARCIUM_CLUSTER_PUBKEY } from '$env/static/public';

export class WithdrawService {
  /**
   * Withdraw DC → USDC
   * Reference: tests/degen_cash.ts:421-448
   */
  static async withdraw(
    programService: ProgramService,
    userKeypair: Keypair,
    amount: number, // In DC (6 decimals)
    depositMint: PublicKey
  ): Promise<string> {
    const program = programService.getProgram();
    const arciumClusterPubkey = new PublicKey(PUBLIC_ARCIUM_CLUSTER_PUBKEY);
    const computationOffset = new anchor.BN(randomBytes(8));

    // Derive PDAs
    const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_global_mint')],
      program.programId
    );

    const [dcUserTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('dc_user_token_account'), userKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Get or create withdraw ATA (for global mint PDA)
    const withdrawAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      userKeypair, // Payer
      depositMint,
      dcGlobalMintPDA,
      true // Allow PDA owner
    );

    // Get user's USDC ATA
    const userAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      userKeypair,
      depositMint,
      userKeypair.publicKey
    );

    const signature = await program.methods
      .queueWithdraw(computationOffset, new anchor.BN(amount))
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumClusterPubkey,
        payer: userKeypair.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset('withdraw')).readUInt32LE()
        ),
        dcGlobalMintAccount: dcGlobalMintPDA,
        dcUserTokenAccount: dcUserTokenAccount,
        withdrawAta: withdrawAta.address,
        toAta: userAta.address,
        withdrawMint: depositMint,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([userKeypair])
      .rpc({ skipPreflight: false, commitment: 'confirmed' });

    return signature;
  }

  /**
   * Poll for withdraw completion
   * Checks if DC balance decreased and USDC balance increased
   */
  static async pollForCompletion(
    programService: ProgramService,
    userPublicKey: PublicKey,
    userX25519PrivateKey: Uint8Array,
    mxePublicKey: Uint8Array,
    previousDCBalance: string,
    expectedDecrease: string,
    maxAttempts = 20
  ): Promise<boolean> {
    // Wait for MPC computation (optimistic: 2.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Fetch DC account
        const dcAccount = await programService.getDCTokenAccount(userPublicKey);
        if (!dcAccount) {
          throw new Error('DC account not found');
        }

        // Decrypt balance
        const sharedSecret = x25519.getSharedSecret(userX25519PrivateKey, mxePublicKey);
        const cipher = new RescueCipher(sharedSecret);
        const nonceBytes = new anchor.BN(dcAccount.amountNonce.toString()).toArrayLike(
          Buffer,
          'le',
          16
        );
        const decryptedBalance = cipher.decrypt([dcAccount.amount], nonceBytes);

        // Check if balance decreased
        const expectedBalance = BigInt(previousDCBalance) - BigInt(expectedDecrease);
        if (BigInt(decryptedBalance) <= expectedBalance) {
          return true;
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        // Account might not exist yet or RPC error
        if (attempt === maxAttempts) {
          throw new Error(`Withdraw polling failed after ${maxAttempts} attempts: ${error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return false;
  }
}
