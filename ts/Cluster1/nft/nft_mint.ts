import { Commitment, Connection, Keypair } from "@solana/web3.js";
import wallet from "../../wba-wallet.json";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
} from "@metaplex-foundation/js";

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
    const { nft } = await metaplex.nfts().create({
      uri: "https://arweave.net/96YnJjC7BIY-koxgCckAklguLvNMbkapMdSiK3UmwAc",
      sellerFeeBasisPoints: 0,
      name: "My Rug",
    });

    console.log("You minted your nft: ", nft);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
