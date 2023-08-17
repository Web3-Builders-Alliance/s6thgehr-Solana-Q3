import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "./wba-wallet.json";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";
import keys from "./keys.json";

// We're going to import our keypair from the wallet file
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey(keys.token_mint);

// Recipient address
const to = new PublicKey("5kRot8UnMEqoDkAc72e7pqaEaF5hxGmbDNowMmPiCDmb");

(async () => {
  try {
    const mintInfo = await getMint(connection, mint);
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const from_ata = await getOrCreateAssociatedTokenAccount(
      connection,
      from,
      mint,
      from.publicKey
    );
    // Get the token account of the toWallet address, and if it does not exist, create it
    const to_ata = await getOrCreateAssociatedTokenAccount(
      connection,
      from,
      mint,
      to
    );

    // Transfer the new token to the "toTokenAccount" we just created
    const sig = await transfer(
      connection,
      from,
      from_ata.address,
      to_ata.address,
      from,
      10 * 10 ** mintInfo.decimals
    );

    console.log("Signature:", sig);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
