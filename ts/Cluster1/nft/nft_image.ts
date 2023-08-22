import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import wallet from "../../wba-wallet.json";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { readFile } from "fs/promises";
import { readFileSync } from "fs";

const payer = Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(payer))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  );

(async () => {
  try {
    let img = readFileSync("./Cluster1/nft/generug.png");
    let imgFile = toMetaplexFile(img, "myrug.png");

    const metadata = {
      name: "My Rug",
      symbol: "RUG",
      description:
        "A rug generated from https://deanmlittle.github.io/generug/",
      image: imgFile,
    };

    const { uri } = await metaplex.nfts().uploadMetadata(metadata);

    console.log("You uploaded your metadata: ", uri);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
