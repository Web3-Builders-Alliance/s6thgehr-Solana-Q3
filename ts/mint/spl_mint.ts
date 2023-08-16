import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import wallet from "./wba-wallet.json";
import keys from "./keys.json";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

(async () => {
  const payer = Keypair.fromSecretKey(new Uint8Array(wallet));
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const tokenMint = new PublicKey(keys.token_mint);
  const mintInfo = await getMint(connection, tokenMint);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey
  );
  console.log("Token account address:", tokenAccount.address.toBase58());

  const amountOfTokensToMint = 1_000;

  console.log("Minting some tokens to the ata...");
  await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount.address,
    payer,
    amountOfTokensToMint * 10 ** mintInfo.decimals
  );
})();
