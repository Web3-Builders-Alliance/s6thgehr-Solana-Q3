use anchor_lang::prelude::*;

declare_id!("DUYPwApAUKzthYjiFxTRJKhq4EJM9Wz76a2DLHbA2qjB");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
