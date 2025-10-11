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
} from "@arcium-hq/client";
import { PublicKey } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";

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

  it("Should init global dc mint", async () => {
    try {
      const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

      // Initialize computation definition for init_global_dc_mint
      console.log("Initializing init_global_dc_mint computation definition");
      const initSig = await initGlobalDCMintCompDef(program, owner);
      console.log("Computation definition initialized with signature", initSig);

      // Wait 5 seconds before queueing computation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Create mint account
      console.log("Creating mint account");
      const mintKeypair = anchor.web3.Keypair.generate();
      const mint = await createMint(
        program.provider.connection,
        owner,
        owner.publicKey,
        owner.publicKey,
        9,
        mintKeypair
      );
      console.log("Mint created:", mint.toBase58());

      // Queue the init_global_dc_mint computation
      const computationOffset = new anchor.BN(randomBytes(8), "hex");
      const nonce = randomBytes(16);

      const eventPromise = awaitEvent("initGlobalDcMintEvent");

      console.log("Queueing init_global_dc_mint computation");
      const queueSig = await program.methods
        .queueInitGlobalDcMint(computationOffset, new anchor.BN(deserializeLE(nonce).toString()), mint)
        .accountsPartial({
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
        })
        .signers([owner])
        .rpc({ skipPreflight: false, commitment: "confirmed" });

      console.log("Queue signature:", queueSig);

      const event = await eventPromise;
      console.log("InitGlobalDcMintEvent received:", event);
      const [dcGlobalMintPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("dc_global_mint")],
        program.programId
      );
      const dcGlobalMintAccount = await program.account.dcGlobalMint.fetch(dcGlobalMintPDA, "confirmed");
      console.log("DCGlobalMint account data:", dcGlobalMintAccount);
    } catch (error) {
      console.log("Error initializing global dc mint", error);
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
});

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}