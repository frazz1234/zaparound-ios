-- Add stripe_payment_intent_id column to bookings table
ALTER TABLE bookings 
ADD COLUMN stripe_payment_intent_id text;

-- Create index for faster lookups
CREATE INDEX idx_bookings_stripe_payment_intent_id ON bookings(stripe_payment_intent_id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking payments';

-- Update the status check constraint to include new statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'cancelled', 'refunded', 'failed'));

-- Update the payment_status check constraint to include new statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'canceled')); 