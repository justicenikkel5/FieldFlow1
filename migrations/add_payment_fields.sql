
-- Add payment fields to appointments table
ALTER TABLE appointments 
ADD COLUMN payment_status TEXT,
ADD COLUMN payment_intent_id TEXT,
ADD COLUMN amount_paid REAL,
ADD COLUMN refund_id TEXT,
ADD COLUMN refund_amount REAL;

-- Add Stripe customer ID to users table  
ALTER TABLE users 
ADD COLUMN stripe_customer_id TEXT;

-- Create index on payment_intent_id for faster lookups
CREATE INDEX idx_appointments_payment_intent_id ON appointments(payment_intent_id);

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
