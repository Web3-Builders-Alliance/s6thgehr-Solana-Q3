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
    let img = readFileSync("./Cluster1/nft/generug.png");
    let imgFile = toMetaplexFile(img, "myrug.png");

    const uri = await metaplex.storage().upload(imgFile);

    console.log("You uploaded your image: ", uri);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
