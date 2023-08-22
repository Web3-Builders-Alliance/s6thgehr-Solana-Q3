import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  validateAccounts,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "../../Prerequisite/airdrop/programs/wba_vault";
import wallet from "../../wba-wallet.json";

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

const vaultState = Keypair.generate();
console.log("Vault state:", vaultState.publicKey);

const vaultAuth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
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
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair, vaultState])
      .rpc();
    console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
