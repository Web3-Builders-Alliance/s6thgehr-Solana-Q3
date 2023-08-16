import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import wallet from "./wba-wallet.json";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
} from "@metaplex-foundation/js";
import keys from "./keys.json";

// We're going to import our keypair from the wallet file
const payer = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define our Mint address
const mint = new PublicKey(keys.token_mint);

// Create PDA for token metadata
const metadata_seeds = [
  Buffer.from("metadata"),
  METADATA_PROGRAM_ID.toBuffer(),
  mint.toBuffer(),
];
const [metadata_pda, _bump] = PublicKey.findProgramAddressSync(
  metadata_seeds,
  METADATA_PROGRAM_ID
);

(async () => {
  try {
    // Start here
    const metadata = {
      name: "WBA Solana Q3",
      symbol: "WBAQ3",
      description: "WBA Solana Q3 ",
      image:
        "https://cdn.pixabay.com/photo/2013/07/13/01/21/euro-155597_1280.png",
    };

    // create an instance of Metaplex sdk for use
    const metaplex = Metaplex.make(connection)
      // set our keypair to use, and pay for the transaction
      .use(keypairIdentity(payer))
      // define a storage mechanism to upload with
      .use(
        bundlrStorage({
          address: "https://devnet.bundlr.network",
          providerUrl: "https://api.devnet.solana.com",
          timeout: 60000,
        })
      );

    const { uri } = await metaplex.nfts().uploadMetadata(metadata);

    console.log(uri);

    // Create the Metadata account for the Mint
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadata_pda,
        mint: mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            creators: null,
            name: "WBA Solana Q3",
            symbol: "WBAQ3",
            uri: uri,
            sellerFeeBasisPoints: 0,
            collection: null,
            uses: null,
          },
          collectionDetails: null,
          isMutable: true,
        },
      }
    );

    let blockhash = await connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [createMetadataInstruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    tx.sign([payer]);

    const sig = await connection.sendTransaction(tx);

    console.log("Transaction completed: ", sig);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
