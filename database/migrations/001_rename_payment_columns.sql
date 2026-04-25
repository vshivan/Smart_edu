-- ============================================================
-- Migration: Rename Stripe columns to generic gateway names
-- Reason: App now uses Razorpay, not Stripe
-- ============================================================

-- Payments table
ALTER TABLE payments RENAME COLUMN stripe_session_id TO gateway_order_id;
ALTER TABLE payments RENAME COLUMN stripe_payment_id TO gateway_payment_id;

-- Subscriptions table
ALTER TABLE subscriptions RENAME COLUMN stripe_sub_id TO gateway_sub_id;
ALTER TABLE subscriptions RENAME COLUMN stripe_cust_id TO gateway_customer_id;

-- Update comments for clarity
COMMENT ON COLUMN payments.gateway_order_id IS 'Razorpay order_id or equivalent from payment gateway';
COMMENT ON COLUMN payments.gateway_payment_id IS 'Razorpay payment_id or equivalent from payment gateway';
COMMENT ON COLUMN subscriptions.gateway_sub_id IS 'Razorpay subscription_id or equivalent';
COMMENT ON COLUMN subscriptions.gateway_customer_id IS 'Razorpay customer_id or equivalent';
