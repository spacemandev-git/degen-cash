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
} from "@arcium-hq/client";
import { PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import nacl from "tweetnacl";

describe("Degen Cash", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.DegenCash as Program<DegenCash>;
  const arciumEnv = getArciumEnv();

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

  it("Should init global dc mint and deposit", async () => {
    try {
      const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

      // Create deposit mint
      console.log("Creating deposit mint");
      const depositMintKeypair = anchor.web3.Keypair.generate();
      const depositMint = await createMint(
        program.provider.connection,
        owner,
        owner.publicKey,
        owner.publicKey,
        9,
        depositMintKeypair
      );
      console.log("Deposit mint created:", depositMint.toBase58());

      // Create two user keypairs
      const user1 = anchor.web3.Keypair.generate();
      const user2 = anchor.web3.Keypair.generate();
      console.log("User 1:", user1.publicKey.toBase58());
      console.log("User 2:", user2.publicKey.toBase58());

      // Airdrop 1 SOL to each user
      console.log("Airdropping 1 SOL to user 1");
      const airdrop1Sig = await program.provider.connection.requestAirdrop(
        user1.publicKey,
        1_000_000_000
      );
      await program.provider.connection.confirmTransaction(airdrop1Sig);

      console.log("Airdropping 1 SOL to user 2");
      const airdrop2Sig = await program.provider.connection.requestAirdrop(
        user2.publicKey,
        1_000_000_000
      );
      await program.provider.connection.confirmTransaction(airdrop2Sig);

      // Create ATAs and mint 10k tokens to each user
      console.log("Creating ATA and minting 10k tokens to user 1");
      const user1Ata = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        owner,
        depositMint,
        user1.publicKey
      );
      await mintTo(
        program.provider.connection,
        owner,
        depositMint,
        user1Ata.address,
        owner,
        10_000_000_000_000
      );

      console.log("Creating ATA and minting 10k tokens to user 2");
      const user2Ata = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        owner,
        depositMint,
        user2.publicKey
      );
      await mintTo(
        program.provider.connection,
        owner,
        depositMint,
        user2Ata.address,
        owner,
        10_000_000_000_000
      );

      // Initialize computation definitions
      console.log("Initializing init_global_dc_mint computation definition");
      const initGlobalSig = await initGlobalDCMintCompDef(program, owner);
      console.log("init_global_dc_mint comp def initialized with signature:", initGlobalSig);

      console.log("Initializing deposit computation definition");
      const initDepositSig = await initDepositCompDef(program, owner);
      console.log("deposit comp def initialized with signature:", initDepositSig);

      console.log("Initializing create_dc_token_account computation definition");
      const initCreateDcTokenSig = await initCreateDcTokenAccountCompDef(program, owner);
      console.log("create_dc_token_account comp def initialized with signature:", initCreateDcTokenSig);

      // Wait 5 seconds before queueing computation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Queue the init_global_dc_mint computation
      const computationOffset = new anchor.BN(randomBytes(8), "hex");
      const nonce = randomBytes(16);

      const eventPromise = awaitEvent("initGlobalDcMintEvent");

      console.log("Queueing init_global_dc_mint computation");
      const queueSig = await program.methods
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

      console.log("Queue signature:", queueSig);

      const event = await eventPromise;
      console.log("InitGlobalDcMintEvent received:", event);

      console.log("Waiting for 2 seconds before fetching DC Global Mint Account");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dc_global_mint")],
        program.programId
      );
      const dcGlobalMintAccount = await program.account.dcGlobalMint.fetch(dcGlobalMintPDA, "confirmed");
      console.log("DCGlobalMint account after init:", dcGlobalMintAccount);

      // Create DC token account for user 1
      try {
        console.log("\n=== Creating DC Token Account for User 1 ===");
        const createDcTokenComputationOffset = new anchor.BN(randomBytes(8), "hex");

        const [dcUser1TokenAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("dc_user_token_account"), user1.publicKey.toBuffer()],
          program.programId
        );

        // Derive x25519 key from user1's signature on "dgn.cash"
        const message = Buffer.from("dgn.cash");
        const signature = nacl.sign.detached(message, user1.secretKey);
        const x25519PrivateKey = signature.slice(0, 32);
        const user1X25519PublicKey = x25519.getPublicKey(x25519PrivateKey);
        const createDcTokenNonce = randomBytes(16);

        console.log("User 1 x25519 public key:", Buffer.from(user1X25519PublicKey).toString("hex"));

        const createDcTokenSig = await program.methods
          .queueCreateDcTokenAccount(
            createDcTokenComputationOffset,
            Array.from(user1X25519PublicKey),
            new anchor.BN(deserializeLE(createDcTokenNonce).toString())
          )
          .accounts({
            computationAccount: getComputationAccAddress(
              program.programId,
              createDcTokenComputationOffset
            ),
            clusterAccount: arciumEnv.arciumClusterPubkey,
            payer: user1.publicKey,
            mxeAccount: getMXEAccAddress(program.programId),
            mempoolAccount: getMempoolAccAddress(program.programId),
            executingPool: getExecutingPoolAccAddress(program.programId),
            compDefAccount: getCompDefAccAddress(
              program.programId,
              Buffer.from(getCompDefAccOffset("init_user_dc_balance")).readUInt32LE()
            ),
          })
          .signers([user1])
          .rpc({ skipPreflight: false, commitment: "confirmed" });
        console.log("Queue create DC token account signature:", createDcTokenSig);

        // Sleep for 2 seconds then fetch
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const dcUser1Account1 = await program.account.dcUserTokenAccount.fetch(dcUser1TokenAccount, "confirmed");
        console.log("User 1 DC token account after creation:", dcUser1Account1);
      } catch (error) {
        console.log("Error creating DC token account:", error);
      }

      // Deposit 1k tokens from user 1
      try {
        console.log("\n=== Depositing 1k tokens from User 1 ===");
        const depositComputationOffset = new anchor.BN(randomBytes(8), "hex");
        const depositAmount = new anchor.BN(1_000_000_000_000);

        const [dcUser1TokenAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("dc_user_token_account"), user1.publicKey.toBuffer()],
          program.programId
        );

        // Derive x25519 key from user1's signature on "dgn.cash" (same as before)
        const message = Buffer.from("dgn.cash");
        const signature = nacl.sign.detached(message, user1.secretKey);
        const x25519PrivateKey = signature.slice(0, 32);
        const user1X25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

        console.log("User 1 x25519 public key for deposit:", Buffer.from(user1X25519PublicKey).toString("hex"));

        const depositSig = await program.methods
          .queueDeposit(
            depositComputationOffset,
            depositAmount,
            Array.from(user1X25519PublicKey)
          )
          .accountsPartial({
            computationAccount: getComputationAccAddress(
              program.programId,
              depositComputationOffset
            ),
            clusterAccount: arciumEnv.arciumClusterPubkey,
            payer: user1.publicKey,
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
          .signers([user1])
          .rpc({ skipPreflight: false, commitment: "confirmed" });

        console.log("Deposit queue signature:", depositSig);

        // Wait for deposit event
        const eventPromise2 = awaitEvent("depositEvent");
        const event2 = await eventPromise2;
        console.log("DepositEvent received:", event2);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const dcUser1Account2 = await program.account.dcUserTokenAccount.fetch(dcUser1TokenAccount, "confirmed");
        console.log("User 1 DC token account after deposit:", dcUser1Account2);
      } catch (error) {
        console.log("Error depositing:", error);
      }

    } catch (error) {
      console.log("Error in test:", error);
    }
  });

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