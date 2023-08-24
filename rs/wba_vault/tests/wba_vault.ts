import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { WbaVault } from "../target/types/wba_vault";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";

describe("wba_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WbaVault as Program<WbaVault>;

  const [state, state_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), provider.publicKey.toBytes()],
    program.programId
  );
  const [vault, vault_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), state.toBytes()],
    program.programId
  );
  const [auth, auth_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("auth"), state.toBytes()],
    program.programId
  );

  const depositAmount = new anchor.BN(1e9);
  const withdrawAmount = new anchor.BN(1e8);

  it("Is initialized!", async () => {
    await program.methods
      .initialize()
      .accounts({
        owner: provider.publicKey,
        auth: auth,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const stateAccount = await program.account.vaultState.fetch(state);

    expect(stateAccount.stateBump).to.eq(state_bump);
    expect(stateAccount.vaultBump).to.eq(vault_bump);
    expect(stateAccount.authBump).to.eq(auth_bump);
  });

  it("Deposits!", async () => {
    await program.methods
      .deposit(depositAmount)
      .accounts({
        owner: provider.publicKey,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balance = await provider.connection.getBalance(vault);

    expect(balance.toString()).to.eq(depositAmount.toString());
  });

  it("Withdraws!", async () => {
    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        owner: provider.publicKey,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balance = await provider.connection.getBalance(vault);

    expect(balance.toString()).to.eq(
      depositAmount.sub(withdrawAmount).toString()
    );
  });
});
