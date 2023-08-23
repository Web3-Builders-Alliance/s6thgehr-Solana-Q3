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
      uri: "https://arweave.net/46oYqgwlgx18eKTDI2pcBKl44S_xUeB12RJPhGhVn9Y",
      sellerFeeBasisPoints: 0,
      name: "Rug#22",
      symbol: "RUG",
    });

    console.log("You minted your nft: ", nft);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
