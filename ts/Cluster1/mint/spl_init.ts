import { createMint } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import wallet from "./wba-wallet.json";

const payer = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const mintKeypair = Keypair.generate();

console.log("Creating a token mint...");
(async () => {
  try {
    const mint = await createMint(
      connection,
      payer,
      // mint authority
      payer.publicKey,
      // freeze authority
      payer.publicKey,
      // decimals
      6,
      mintKeypair
    );
    console.log("Token's mint address:", mint.toBase58());
  } catch (e) {
    console.log(e);
  }
})();
