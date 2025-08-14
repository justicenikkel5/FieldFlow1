
-- Add stripeCustomerId column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
