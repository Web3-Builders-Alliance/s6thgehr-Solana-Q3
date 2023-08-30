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
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";

const confirmTx = async (signature: string) => {
  const latestBlockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    "confirmed"
  );
  return signature;
};

describe("wba_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = Keypair.generate();
  const mintKeypair = Keypair.generate();

  const program = anchor.workspace.WbaVault as Program<WbaVault>;

  const [state, stateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), payer.publicKey.toBytes()],
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

  const solAmount = 10 * LAMPORTS_PER_SOL;

  const decimals = 9;
  const splAmount = 10 * 10 ** decimals;

  it("Prefunds payer wallet with sol and spl token", async () => {
    await provider.connection
      .requestAirdrop(payer.publicKey, solAmount)
      .then(confirmTx);
    const solBalance = await provider.connection.getBalance(payer.publicKey);

    const tokenMint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      decimals,
      mintKeypair
    );

    const ownerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMint,
      payer.publicKey
    );

    await mintTo(
      provider.connection,
      payer,
      tokenMint,
      ownerAta.address,
      payer,
      splAmount
    );

    const ownerAtaInfo = await getAccount(
      provider.connection,
      ownerAta.address
    );

    expect(solBalance).to.eq(solAmount, "Wrong sol amount");
    expect(splAmount.toString()).to.eq(
      ownerAtaInfo.amount.toString(),
      "Wrong spl amount"
    );
  });

  it("Is initialized!", async () => {
    await program.methods
      .initialize()
      .accounts({
        owner: payer.publicKey,
        auth: auth,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const stateAccount = await program.account.vaultState.fetch(state);

    expect(stateAccount.stateBump).to.eq(stateBump);
    expect(stateAccount.vaultBump).to.eq(vault_bump);
    expect(stateAccount.authBump).to.eq(auth_bump);
  });

  it("Deposits!", async () => {
    await program.methods
      .deposit(depositAmount)
      .accounts({
        owner: payer.publicKey,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const balance = await provider.connection.getBalance(vault);

    expect(balance.toString()).to.eq(depositAmount.toString());
  });

  it("Withdraws!", async () => {
    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        owner: payer.publicKey,
        vault: vault,
        state: state,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const balance = await provider.connection.getBalance(vault);

    expect(balance.toString()).to.eq(
      depositAmount.sub(withdrawAmount).toString()
    );
  });

  it("Deposits SPL token!", async () => {
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    const [vaultTokenAccount, _vaultTokenAccountbump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("spl_vault"), state.toBytes()],
        program.programId
      );

    await program.methods
      .splDeposit(depositAmount)
      .accounts({
        owner: payer.publicKey,
        ownerAta: ownerAta.address,
        mint: mintKeypair.publicKey,
        splVault: vaultTokenAccount,
        auth: auth,
        state: state,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenAccount: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const ownerAtaInfo = await getAccount(
      provider.connection,
      ownerAta.address
    );

    const splVaultInfo = await getAccount(
      provider.connection,
      vaultTokenAccount
    );

    expect(splVaultInfo.amount.toString()).to.eq(
      depositAmount.toString(),
      "Wrong amount deposited"
    );
    expect(ownerAtaInfo.amount.toString()).to.eq(
      (splAmount - depositAmount.toNumber()).toString(),
      "Wrong amount in owner ATA"
    );
  });
});
