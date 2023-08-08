import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("6myQN9vzddHpWfWWHeqBZ4HkPEcQu82Ar5X2HHMTr1TQ");

const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Get balance of dev wallet
    const balance = await connection.getBalance(from.publicKey);

    // create a mock transfer instruction
    const mockTransferIx = SystemProgram.transfer({
      lamports: balance,
      fromPubkey: from.publicKey,
      toPubkey: to,
      programId: SystemProgram.programId,
    });

    let recentBlockhash = await connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    // create a mock transaction message
    let mockMessage = new TransactionMessage({
      payerKey: from.publicKey,
      recentBlockhash,
      instructions: [mockTransferIx],
    }).compileToV0Message();

    const fee =
      (await connection.getFeeForMessage(mockMessage, "confirmed")).value || 0;

    // create a transfer instruction
    const transferIx = SystemProgram.transfer({
      lamports: balance - fee,
      fromPubkey: from.publicKey,
      toPubkey: to,
      programId: SystemProgram.programId,
    });

    // create a transaction message
    let message = new TransactionMessage({
      payerKey: from.publicKey,
      recentBlockhash,
      instructions: [transferIx],
    }).compileToV0Message();

    // create a versioned transaction using the message
    const tx = new VersionedTransaction(message);

    tx.sign([from]);

    // actually send the transaction
    const signature = await connection.sendTransaction(tx);

    console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
