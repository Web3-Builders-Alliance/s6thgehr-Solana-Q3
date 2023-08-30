use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("B19SNU7Gm8VeeJ6GsQgjnzdXgC4QaxrX3EC4udk8HHF2");

#[program]
pub mod wba_vault {

    use super::*;
    use anchor_lang::system_program::{transfer, Transfer};
    use anchor_spl::token::{transfer as spl_transfer, Transfer as SplTransfer};

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.state.auth_bump = *ctx.bumps.get("auth").unwrap();
        ctx.accounts.state.vault_bump = *ctx.bumps.get("vault").unwrap();
        ctx.accounts.state.state_bump = *ctx.bumps.get("state").unwrap();

        Ok(())
    }

    pub fn deposit(ctx: Context<Payment>, amount: u64) -> Result<()> {
        let accounts = Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };

        let cpi = CpiContext::new(ctx.accounts.system_program.to_account_info(), accounts);

        transfer(cpi, amount)
    }

    pub fn withdraw(ctx: Context<Payment>, amount: u64) -> Result<()> {
        let accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        };

        let seeds = &[
            b"vault",
            ctx.accounts.state.to_account_info().key.as_ref(),
            &[ctx.accounts.state.vault_bump],
        ];

        let pda_signer = &[&seeds[..]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            accounts,
            pda_signer,
        );

        transfer(cpi, amount)
    }

    pub fn spl_deposit(ctx: Context<SPLDeposit>, amount: u64) -> Result<()> {
        let accounts = SplTransfer {
            from: ctx.accounts.owner_ata.to_account_info(),
            to: ctx.accounts.spl_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        let cpi = CpiContext::new(ctx.accounts.token_program.to_account_info(), accounts);

        spl_transfer(cpi, amount)
    }

    pub fn spl_withdraw(_ctx: Context<SPLWithdraw>, _amount: u64) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    owner: Signer<'info>,
    #[account(seeds=[b"auth", state.key().as_ref()], bump)]
    ///CHECK: This is safe
    auth: UncheckedAccount<'info>,
    #[account(seeds=[b"vault", state.key().as_ref()], bump)]
    vault: SystemAccount<'info>,
    #[account(init, payer=owner, space=VaultState::LEN, seeds=[b"state", owner.key().as_ref()], bump)]
    state: Account<'info, VaultState>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Payment<'info> {
    #[account(mut)]
    owner: Signer<'info>,
    #[account(mut, seeds=[b"vault", state.key().as_ref()], bump = state.vault_bump)]
    vault: SystemAccount<'info>,
    #[account(seeds=[b"state", owner.key().as_ref()], bump = state.state_bump)]
    state: Account<'info, VaultState>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SPLDeposit<'info> {
    #[account(mut)]
    owner: Signer<'info>,
    #[account(mut, associated_token::authority = owner, associated_token::mint = mint)]
    owner_ata: Account<'info, TokenAccount>,
    mint: Account<'info, Mint>,
    #[account(seeds=[b"auth", state.key().as_ref()], bump)]
    ///CHECK: This is safe
    auth: UncheckedAccount<'info>,
    #[account(init, seeds=[b"spl_vault", state.key().as_ref()], payer = owner, token::mint = mint, token::authority = auth, bump)]
    spl_vault: Account<'info, TokenAccount>,
    #[account(seeds=[b"state", owner.key().as_ref()], bump = state.state_bump)]
    state: Account<'info, VaultState>,
    token_program: Program<'info, Token>,
    associated_token_account: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SPLWithdraw<'info> {
    #[account(mut)]
    owner: Signer<'info>,
    #[account(mut, associated_token::authority = owner, associated_token::mint = mint)]
    owner_ata: Account<'info, TokenAccount>,
    mint: Account<'info, Mint>,
    #[account(seeds=[b"auth", state.key().as_ref()], bump)]
    ///CHECK: This is safe
    auth: UncheckedAccount<'info>,
    #[account(init, seeds=[b"spl_vault", state.key().as_ref()], payer = owner, token::mint = mint, token::authority = auth, bump)]
    vault: Account<'info, TokenAccount>,
    #[account(seeds=[b"state", owner.key().as_ref()], bump = state.state_bump)]
    state: Account<'info, VaultState>,
    token_program: Program<'info, Token>,
    associated_token_account: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
}

#[account]
pub struct VaultState {
    auth_bump: u8,
    vault_bump: u8,
    state_bump: u8,
}

impl VaultState {
    const LEN: usize = 8 + 1 + 1 + 1;
}
