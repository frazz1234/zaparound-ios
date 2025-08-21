# Flight Booking Webhook Issue - Fix Guide

## Problem Description

Flight bookings are getting stuck in `pending_payment` status and don't have Duffel order IDs or booking references because they're being processed by the wrong webhook.

## Root Cause

Both webhooks (`stripe-webhook` and `stripe-flight-webhook`) are using the same environment variable `STRIPE_WEBHOOK_SECRET`, causing flight bookings to be processed by the main subscription webhook instead of the flight-specific webhook.

## What's Happening

1. **Flight booking checkout session is created** with `paymentType: 'flight_booking'`
2. **Stripe sends webhook to main webhook** because both use the same secret
3. **Main webhook skips flight bookings** (only processes subscriptions)
4. **Flight webhook never receives the event** because it's not configured with the right secret
5. **Booking stays in `pending_payment` status** with no Duffel order ID

## Solution

### Step 1: Update Environment Variables

You need to set up separate webhook secrets for each endpoint:

1. **Main webhook** (subscriptions): Keep using `STRIPE_WEBHOOK_SECRET`
2. **Flight webhook**: Use new `STRIPE_FLIGHT_WEBHOOK_SECRET`

### Step 2: Configure Stripe Webhooks

In your Stripe Dashboard:

1. Go to **Developers > Webhooks**
2. **Create two separate webhook endpoints**:

#### Main Webhook (Subscriptions)
- **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Events**: 
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- **Secret**: Use the existing `STRIPE_WEBHOOK_SECRET`

#### Flight Webhook (Flight Bookings)
- **URL**: `https://ynvnzmkpifwteyuxondc.supabase.co/functions/v1/stripe-flight-webhook`
- **Events**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
- **Secret**: Create new `STRIPE_FLIGHT_WEBHOOK_SECRET`

### Step 3: Update Environment Variables

Add the new environment variable to your Supabase project:

```bash
# In Supabase Dashboard > Settings > Environment Variables
STRIPE_FLIGHT_WEBHOOK_SECRET=whsec_your_flight_webhook_secret_here
```

### Step 4: Code Changes Made

The following changes have been made to fix the issue:

#### 1. Updated Flight Webhook (`supabase/functions/stripe-flight-webhook/index.ts`)
- Changed from `STRIPE_WEBHOOK_SECRET` to `STRIPE_FLIGHT_WEBHOOK_SECRET`
- Added better logging for debugging
- Enhanced error handling for booking lookup

#### 2. Updated Main Webhook (`supabase/functions/stripe-webhook/index.ts`)
- Added explicit logging when flight bookings are detected
- Improved handling of non-subscription payments

### Step 5: Testing the Fix

1. **Create a test flight booking**
2. **Check the logs** in both webhook functions
3. **Verify the booking status** changes from `pending_payment` to `confirmed`
4. **Confirm Duffel order ID and booking reference** are populated

### Step 6: Monitoring

After deployment, monitor:

1. **Webhook delivery logs** in Stripe Dashboard
2. **Function execution logs** in Supabase Dashboard
3. **Booking status changes** in your database
4. **Duffel API calls** and responses

## Expected Flow After Fix

1. **Flight booking checkout** → Stripe creates session
2. **Stripe sends webhook** to flight webhook endpoint
3. **Flight webhook processes** the booking
4. **Duffel API call** creates the actual booking
5. **Booking status updated** to `confirmed` with Duffel details

## Troubleshooting

### If bookings still show pending_payment:
1. Check webhook delivery in Stripe Dashboard
2. Verify environment variables are set correctly
3. Check function logs in Supabase Dashboard
4. Ensure webhook endpoints are configured with correct events

### If Duffel API calls fail:
1. Verify `DUFFEL_API_TOKEN` is set
2. Check Duffel API response logs
3. Validate passenger data format
4. Ensure offer ID is still valid

## Files Modified

- `supabase/functions/stripe-flight-webhook/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `FLIGHT_BOOKING_WEBHOOK_FIX.md` (this file)

## Next Steps

1. **Deploy the updated functions** to Supabase
2. **Configure the new webhook endpoint** in Stripe
3. **Set the new environment variable** in Supabase
4. **Test with a real flight booking**
5. **Monitor the logs** to ensure proper flow 