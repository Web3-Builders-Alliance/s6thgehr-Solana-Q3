use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("DUYPwApAUKzthYjiFxTRJKhq4EJM9Wz76a2DLHbA2qjB");

#[program]
pub mod escrow {
    use anchor_spl::token;

    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        deposit_amount: u64,
        offer_amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        escrow.maker = *ctx.accounts.maker.key;
        escrow.maker_token = ctx.accounts.maker_token.key();
        escrow.taker_token = ctx.accounts.taker_token.key();
        escrow.offer_amount = offer_amount;
        escrow.seed = seed;
        escrow.auth_bump = *ctx.bumps.get("auth").unwrap();
        escrow.vault_bump = *ctx.bumps.get("vault").unwrap();
        escrow.escrow_bump = *ctx.bumps.get("escrow").unwrap();

        let cpi_accounts = token::Transfer {
            from: ctx.accounts.maker_ata.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

        token::transfer(cpi_ctx, deposit_amount)

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
