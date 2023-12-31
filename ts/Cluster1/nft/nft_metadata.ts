import { Commitment, Connection, Keypair } from "@solana/web3.js";
import wallet from "../../wba-wallet.json";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
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
    // let img = readFileSync("./Cluster1/nft/generug.png");
    // let imgFile = toMetaplexFile(img, "myrug.png");

    const metadata = {
      name: "My Rug",
      symbol: "RUG",
      description:
        "A rug generated from https://deanmlittle.github.io/generug/",
      image: "https://arweave.net/SJPD13QPAPfcUQlMQp5cYHmo48eoNUS6U4HZqKS5ta4",
      // image: imgFile,
    };

    const { uri } = await metaplex.nfts().uploadMetadata(metadata);

    console.log("You uploaded your metadata: ", uri);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
