import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DegenCash } from "../target/types/degen_cash";
import { randomBytes } from "crypto";
import {
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  deserializeLE,
  x25519,
  getMXEPublicKey,
  RescueCipher,
} from "@arcium-hq/client";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import nacl from "tweetnacl";
import { expect } from "chai";

interface UserData {
  keypair: Keypair;
  x25519PrivateKey: Uint8Array;
  x25519PublicKey: Uint8Array;
  ata: PublicKey;
  dcTokenAccount: PublicKey;
}

let testLog: string[] = [];

function log(message: string) {
  console.log(message);
  testLog.push(message);
}

function logBox(title: string) {
  const width = 60;
  const padding = Math.floor((width - title.length - 2) / 2);
  const line = "═".repeat(width);
  const titleLine = "║" + " ".repeat(padding) + title + " ".repeat(width - padding - title.length - 2) + "║";
  log(`╔${line}╗`);
  log(titleLine);
  log(`╚${line}╝`);
}

function logSection(title: string) {
  log(`\n${'─'.repeat(60)}`);
  log(`  ${title}`);
  log('─'.repeat(60));
}

function saveTestLog() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tests/test-run-${timestamp}.txt`;
  fs.writeFileSync(filename, testLog.join('\n'));
  console.log(`\nTest log saved to: ${filename}`);
}

describe("Degen Cash", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.DegenCash as Program<DegenCash>;
  const arciumEnv = getArciumEnv();

  let owner: Keypair;
  let depositMint: PublicKey;
  let users: UserData[] = [];
  let mxePublicKey: Uint8Array;

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(
    eventName: E
  ): Promise<Event[E]> => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => {
        res(event);
      });
    });
    await program.removeEventListener(listenerId);

    return event;
  };

  async function getDecryptedBalance(user: UserData): Promise<string> {
    const dcAccount = await program.account.dcUserTokenAccount.fetch(user.dcTokenAccount, "confirmed");
    const sharedSecret = x25519.getSharedSecret(user.x25519PrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);
    const nonceBytes = new anchor.BN(dcAccount.amountNonce.toString()).toArrayLike(Buffer, "le", 16);
    const decryptedBalance = cipher.decrypt([dcAccount.amount], nonceBytes);
    return decryptedBalance.toString();
  }

  async function getSPLBalance(ata: PublicKey): Promise<string> {
    const account = await getAccount(program.provider.connection, ata);
    return account.amount.toString();
  }

  before(async () => {
    logBox("DEGEN CASH COMPREHENSIVE TEST SUITE");
    testLog = [];

    owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    logSection("Setup: Creating Deposit Mint (Fake USDC)");
    const depositMintKeypair = anchor.web3.Keypair.generate();
    depositMint = await createMint(
      program.provider.connection,
      owner,
      owner.publicKey,
      owner.publicKey,
      6,
      depositMintKeypair
    );
    log(`✓ Deposit mint created: ${depositMint.toBase58()}`);

    logSection("Setup: Initializing Computation Definitions");
    await initGlobalDCMintCompDef(program, owner);
    log("✓ init_global_dc_mint comp def");
    await initDepositCompDef(program, owner);
    log("✓ deposit comp def");
    await initCreateDcTokenAccountCompDef(program, owner);
    log("✓ create_dc_token_account comp def");
    await initTransferCompDef(program, owner);
    log("✓ transfer comp def");
    await initWithdrawCompDef(program, owner);
    log("✓ withdraw comp def");

    logSection("Setup: Creating Users and Funding");
    const numUsers = 4;
    for (let i = 0; i < numUsers; i++) {
      const keypair = anchor.web3.Keypair.generate();
      log(`User ${i + 1}: ${keypair.publicKey.toBase58()}`);

      log(`  Airdropping 1 SOL...`);
      const airdropSig = await program.provider.connection.requestAirdrop(
        keypair.publicKey,
        1_000_000_000
      );
      await program.provider.connection.confirmTransaction(airdropSig);

      const ata = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        owner,
        depositMint,
        keypair.publicKey
      );
      await mintTo(
        program.provider.connection,
        owner,
        depositMint,
        ata.address,
        owner,
        10_000_000_000
      );
      log(`  ✓ Minted 10,000 USDC to ATA`);

      const message = Buffer.from("dgn.cash");
      const signature = nacl.sign.detached(message, keypair.secretKey);
      const x25519PrivateKey = signature.slice(0, 32);
      const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

      const [dcTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("dc_user_token_account"), keypair.publicKey.toBuffer()],
        program.programId
      );

      users.push({
        keypair,
        x25519PrivateKey,
        x25519PublicKey,
        ata: ata.address,
        dcTokenAccount,
      });
    }

    mxePublicKey = await getMXEPublicKey(
      program.provider as anchor.AnchorProvider,
      program.programId
    );

    logSection("Setup: Initializing Global DC Mint");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");
    const nonce = randomBytes(16);
    const eventPromise = awaitEvent("initGlobalDcMintEvent");

    await program.methods
      .queueInitGlobalDcMint(computationOffset, new anchor.BN(deserializeLE(nonce).toString()), depositMint)
      .accounts({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("init_global_dc_mint")).readUInt32LE()
        ),
        depositMint: depositMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([owner])
      .rpc({ skipPreflight: false, commitment: "confirmed" });

    await eventPromise;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    log("✓ Global DC Mint initialized");

    logSection("Setup: Creating DC Token Accounts for All Users");
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const createDcTokenComputationOffset = new anchor.BN(randomBytes(8), "hex");
      const createDcTokenNonce = randomBytes(16);

      await program.methods
        .queueCreateDcTokenAccount(
          createDcTokenComputationOffset,
          Array.from(user.x25519PublicKey),
          new anchor.BN(deserializeLE(createDcTokenNonce).toString())
        )
        .accounts({
          computationAccount: getComputationAccAddress(
            program.programId,
            createDcTokenComputationOffset
          ),
          clusterAccount: arciumEnv.arciumClusterPubkey,
          payer: user.keypair.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
          mempoolAccount: getMempoolAccAddress(program.programId),
          executingPool: getExecutingPoolAccAddress(program.programId),
          compDefAccount: getCompDefAccAddress(
            program.programId,
            Buffer.from(getCompDefAccOffset("init_user_dc_balance")).readUInt32LE()
          ),
        })
        .signers([user.keypair])
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      log(`✓ User ${i + 1} DC account created`);
    }

    log("\n" + "═".repeat(60));
    log("Setup Complete - Ready for Tests");
    log("═".repeat(60) + "\n");
  });

  after(async () => {
    saveTestLog();
  });

  it("Should deposit USDC into DC accounts", async () => {
    logBox("TEST 1: DEPOSITS");

    const depositAmounts = [1000, 2500, 500, 3000];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const amount = depositAmounts[i] * 1_000_000;

      logSection(`Depositing ${depositAmounts[i]} USDC for User ${i + 1}`);
      const beforeSPL = await getSPLBalance(user.ata);

      const depositComputationOffset = new anchor.BN(randomBytes(8), "hex");
      const eventPromise = awaitEvent("depositEvent");

      await program.methods
        .queueDeposit(
          depositComputationOffset,
          new anchor.BN(amount)
        )
        .accountsPartial({
          computationAccount: getComputationAccAddress(
            program.programId,
            depositComputationOffset
          ),
          clusterAccount: arciumEnv.arciumClusterPubkey,
          payer: user.keypair.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
          mempoolAccount: getMempoolAccAddress(program.programId),
          executingPool: getExecutingPoolAccAddress(program.programId),
          compDefAccount: getCompDefAccAddress(
            program.programId,
            Buffer.from(getCompDefAccOffset("deposit")).readUInt32LE()
          ),
          depositMint: depositMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user.keypair])
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const afterSPL = await getSPLBalance(user.ata);
      const dcBalance = await getDecryptedBalance(user);

      log(`  USDC: ${beforeSPL} → ${afterSPL} (Δ -${depositAmounts[i]})`);
      log(`  DC:   0 → ${Number(dcBalance) / 1_000_000} (Δ +${depositAmounts[i]})`);
      log(`  ✓ Deposit successful\n`);

      expect(dcBalance).to.equal(amount.toString());
    }
  });

  it("Should transfer DC between users with variance", async () => {
    logBox("TEST 2: TRANSFERS");

    const transfers = [
      { from: 0, to: 1, amount: 100, variance: 10, desc: "User 1 → User 2: 100 DC (10% var)" },
      { from: 1, to: 2, amount: 200, variance: 5, desc: "User 2 → User 3: 200 DC (5% var)" },
      { from: 2, to: 3, amount: 50, variance: 20, desc: "User 3 → User 4: 50 DC (20% var)" },
      { from: 3, to: 0, amount: 150, variance: 0, desc: "User 4 → User 1: 150 DC (0% var)" },
      { from: 0, to: 3, amount: 75, variance: 15, desc: "User 1 → User 4: 75 DC (15% var)" },
    ];

    for (const t of transfers) {
      logSection(t.desc);

      const sender = users[t.from];
      const receiver = users[t.to];
      const amount = t.amount * 1_000_000;

      const senderBefore = await getDecryptedBalance(sender);
      const receiverBefore = await getDecryptedBalance(receiver);

      const transferComputationOffset = new anchor.BN(randomBytes(8), "hex");
      const eventPromise = awaitEvent("transferEvent");

      const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dc_global_mint")],
        program.programId
      );

      await program.methods
        .queueTransfer(
          transferComputationOffset,
          new anchor.BN(amount),
          t.variance,
          receiver.keypair.publicKey
        )
        .accountsPartial({
          computationAccount: getComputationAccAddress(
            program.programId,
            transferComputationOffset
          ),
          clusterAccount: arciumEnv.arciumClusterPubkey,
          payer: sender.keypair.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
          mempoolAccount: getMempoolAccAddress(program.programId),
          executingPool: getExecutingPoolAccAddress(program.programId),
          compDefAccount: getCompDefAccAddress(
            program.programId,
            Buffer.from(getCompDefAccOffset("transfer")).readUInt32LE()
          ),
          dcGlobalMintAccount: dcGlobalMintPDA,
          dcUserTokenAccount: sender.dcTokenAccount,
          receiverDcUserTokenAccount: receiver.dcTokenAccount,
          depositMint: depositMint,
        })
        .signers([sender.keypair])
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      const event = await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const senderAfter = await getDecryptedBalance(sender);
      const receiverAfter = await getDecryptedBalance(receiver);

      const actualVariance = event.variance;
      const varianceCost = (Number(amount) * actualVariance) / 255;

      log(`  Sender:   ${Number(senderBefore) / 1_000_000} → ${Number(senderAfter) / 1_000_000}`);
      log(`  Receiver: ${Number(receiverBefore) / 1_000_000} → ${Number(receiverAfter) / 1_000_000}`);
      log(`  Variance: ${actualVariance}/255 (Cost: ${(varianceCost / 1_000_000).toFixed(2)} DC)`);
      log(`  Status: ${event.statusCode === 0 ? '✓ Success' : '✗ Failed'}\n`);

      expect(event.statusCode).to.equal(0);
    }
  });

  it("Should withdraw DC back to USDC", async () => {
    logBox("TEST 3: WITHDRAWALS");

    const withdrawAmounts = [100, 200, 50, 100];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const amount = withdrawAmounts[i] * 1_000_000;

      logSection(`Withdrawing ${withdrawAmounts[i]} USDC for User ${i + 1}`);

      const dcBefore = await getDecryptedBalance(user);
      const splBefore = await getSPLBalance(user.ata);

      const withdrawComputationOffset = new anchor.BN(randomBytes(8), "hex");
      const eventPromise = awaitEvent("withdrawEvent");

      const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dc_global_mint")],
        program.programId
      );

      const withdrawAta = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        owner,
        depositMint,
        dcGlobalMintPDA,
        true
      );

      await program.methods
        .queueWithdraw(
          withdrawComputationOffset,
          new anchor.BN(amount)
        )
        .accountsPartial({
          computationAccount: getComputationAccAddress(
            program.programId,
            withdrawComputationOffset
          ),
          clusterAccount: arciumEnv.arciumClusterPubkey,
          payer: user.keypair.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
          mempoolAccount: getMempoolAccAddress(program.programId),
          executingPool: getExecutingPoolAccAddress(program.programId),
          compDefAccount: getCompDefAccAddress(
            program.programId,
            Buffer.from(getCompDefAccOffset("withdraw")).readUInt32LE()
          ),
          dcGlobalMintAccount: dcGlobalMintPDA,
          dcUserTokenAccount: user.dcTokenAccount,
          withdrawAta: withdrawAta.address,
          toAta: user.ata,
          withdrawMint: depositMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user.keypair])
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      const event = await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const dcAfter = await getDecryptedBalance(user);
      const splAfter = await getSPLBalance(user.ata);

      log(`  DC:   ${Number(dcBefore) / 1_000_000} → ${Number(dcAfter) / 1_000_000} (Δ -${withdrawAmounts[i]})`);
      log(`  USDC: ${Number(splBefore) / 1_000_000} → ${Number(splAfter) / 1_000_000} (Δ +${withdrawAmounts[i]})`);
      log(`  Status: ${event.statusCode === 0 ? '✓ Success' : '✗ Failed'}\n`);

      expect(event.statusCode).to.equal(0);
      expect(Number(splAfter) - Number(splBefore)).to.equal(amount);
    }
  });

  it("Should show final balances", async () => {
    logBox("FINAL BALANCES");

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const dcBalance = await getDecryptedBalance(user);
      const splBalance = await getSPLBalance(user.ata);

      log(`User ${i + 1}:`);
      log(`  DC:   ${(Number(dcBalance) / 1_000_000).toFixed(2)} DC`);
      log(`  USDC: ${(Number(splBalance) / 1_000_000).toFixed(2)} USDC`);
      log(``);
    }
  });

  async function initTransferCompDef(
    program: Program<DegenCash>,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("transfer");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initTransferCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    return sig;
  }

  async function initWithdrawCompDef(
    program: Program<DegenCash>,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("withdraw");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initWithdrawCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    return sig;
  }

  async function initGlobalDCMintCompDef(
    program: Program<DegenCash>,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("init_global_dc_mint");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initGlobalDcMintCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    return sig;
  }

  async function initDepositCompDef(
    program: Program<DegenCash>,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("deposit");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initDepositCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    return sig;
  }

  async function initCreateDcTokenAccountCompDef(
    program: Program<DegenCash>,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("init_user_dc_balance");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initCreateDcTokenAccountCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    return sig;
  }
});

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}