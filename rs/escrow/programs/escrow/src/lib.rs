use std::collections::BTreeMap;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, self},
};

declare_id!("DUYPwApAUKzthYjiFxTRJKhq4EJM9Wz76a2DLHbA2qjB");

#[program]
pub mod escrow {

    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        deposit_amount: u64,
        offer_amount: u64,
    ) -> Result<()> {
        ctx.accounts.init(&ctx.bumps, seed, offer_amount)?;
        ctx.accounts.deposit_to_vault(deposit_amount)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit_to_maker()?;
        ctx.accounts.empty_vault_to_taker()?;
        ctx.accounts.close_accounts()
    }
}

#[derive(Accounts)]
#[instruction(seed:u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut, 
        associated_token::mint = maker_token, 
        associated_token::authority = maker
    )]
    pub maker_ata: Account<'info, TokenAccount>,
    pub maker_token: Box<Account<'info, Mint>>,
    pub taker_token: Box<Account<'info, Mint>>,
    #[account(seeds = [b"auth", escrow.key().as_ref()], bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        init, 
        payer=maker,  
        seeds=[b"vault", escrow.key().as_ref()], 
        bump,  
        token::mint = maker_token, 
        token::authority = auth
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init, 
        payer=maker, 
        seeds=[b"escrow", 
        maker.key.as_ref(), 
        seed.to_le_bytes().as_ref()], 
        bump, 
        space = Escrow::LEN
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    pub fn init(&mut self, bumps: &BTreeMap<String, u8>, seed: u64, offer_amount: u64) -> Result<()> {
        let escrow = &mut self.escrow;

        escrow.maker = *self.maker.key;
        escrow.maker_token = self.maker_token.key();
        escrow.taker_token = self.taker_token.key();
        escrow.offer_amount = offer_amount;
        escrow.seed = seed;
        escrow.auth_bump = *bumps.get("auth").unwrap();
        escrow.vault_bump = *bumps.get("vault").unwrap();
        escrow.escrow_bump = *bumps.get("escrow").unwrap();
        Ok(())
    }

    pub fn deposit_to_vault(&self, deposit_amount: u64) -> Result<()> {
        let cpi_accounts = token::Transfer {
            from: self.maker_ata.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);

        token::transfer(cpi_ctx, deposit_amount)
    }
}

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    /// Check: This is safe
    pub maker: UncheckedAccount<'info>,
    #[account(
        init_if_needed, 
        associated_token::mint = taker_token, 
        associated_token::authority = maker,
        payer=taker,
    )]
    pub maker_receive_ata: Account<'info, TokenAccount>,
    #[account( 
        mut,
        associated_token::mint = taker_token, 
        associated_token::authority = taker,
    )]
    pub taker_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed, 
        associated_token::mint = maker_token, 
        associated_token::authority = taker,
        payer=taker,
    )]
    pub taker_receive_ata: Account<'info, TokenAccount>,
    pub maker_token: Box<Account<'info, Mint>>,
    pub taker_token: Box<Account<'info, Mint>>,
    #[account(seeds = [b"auth", escrow.key().as_ref()], bump = escrow.auth_bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        mut, 
        seeds=[b"vault", escrow.key().as_ref()], 
        bump = escrow.vault_bump,  
        token::mint = maker_token, 
        token::authority = auth
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds=[b"escrow", 
        maker.key.as_ref(), 
        escrow.seed.to_le_bytes().as_ref()], 
        bump = escrow.escrow_bump, 
        close = maker,
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    pub fn deposit_to_maker(&self) -> Result<()> {
        let cpi_accounts = token::Transfer {
            from: self.taker_ata.to_account_info(),
            to: self.maker_receive_ata.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);

        token::transfer(cpi_ctx, self.escrow.offer_amount) 
    }

    pub fn empty_vault_to_taker(&self) -> Result<()> {
        let cpi_accounts = token::Transfer {
            from: self.vault.to_account_info(),
            to: self.taker_receive_ata.to_account_info(),
            authority: self.auth.to_account_info(),
        };

        let seeds = &[b"auth", self.escrow.to_account_info().key.as_ref(), &[self.escrow.auth_bump]];
        let pda_signer = [&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, &pda_signer);

        token::transfer(cpi_ctx, self.escrow.offer_amount) 
    }

    pub fn close_accounts(&mut self) -> Result<()> {
        let cpi_accounts = token::CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
            authority: self.auth.to_account_info(),
        };

        let seeds = &[b"auth", self.escrow.to_account_info().key.as_ref(), &[self.escrow.auth_bump]];
        let pda_signer = [&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, &pda_signer);

        token::close_account(cpi_ctx)
    }
    
}

#[account]
pub struct Escrow {
    pub maker: Pubkey,
    pub maker_token: Pubkey,
    pub taker_token: Pubkey,
    pub offer_amount: u64,
    pub seed: u64,
    pub auth_bump: u8,
    pub vault_bump: u8,
    pub escrow_bump: u8,
}

impl Escrow {
    const LEN: usize = 8 + 32 * 3 + 8 * 2 + 1 * 3;
}
