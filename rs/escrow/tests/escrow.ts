import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;

  it("Makes an escrow !", async () => {
    const tx = await program.methods
      .make(new anchor.BN(1), new anchor.BN(100), new anchor.BN(100))
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
