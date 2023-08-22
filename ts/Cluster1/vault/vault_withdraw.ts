import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "../../Prerequisite/airdrop/programs/wba_vault";
import wallet from "../../wba-wallet.json";
import keys from "../keys.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});

const program = new Program<WbaVault>(
  IDL,
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address,
  provider
);

const vaultState = new PublicKey(keys.vault_state);

const vaultAuth_seeds = [Buffer.from("auth"), vaultState.toBuffer()];
const [vaultAuth, _bumpAuth] = PublicKey.findProgramAddressSync(
  vaultAuth_seeds,
  program.programId
);
console.log("Vault auth:", vaultAuth);

const vault_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
const [vault, _bumpVault] = PublicKey.findProgramAddressSync(
  vault_seeds,
  program.programId
);
console.log("Vault:", vault);

(async () => {
  try {
    const txhash = await program.methods
      .withdraw(new BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState,
        vaultAuth: vaultAuth,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
