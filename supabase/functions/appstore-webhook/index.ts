import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AppStoreNotification {
  signedPayload: string;
  environment: 'Sandbox' | 'Production';
  notificationType: string;
  subtype?: string;
  version: string;
}

interface DecodedPayload {
  notificationType: string;
  subtype?: string;
  data: {
    bundleId: string;
    environment: string;
    signedTransactionInfo: string;
    signedRenewalInfo: string;
    status: number;
    [key: string]: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the notification from App Store
    const notification: AppStoreNotification = await req.json()
    
    if (!notification.signedPayload) {
      return new Response(
        JSON.stringify({ error: 'Missing signed payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // In a real implementation, you would verify the signed payload
    // For now, we'll decode it (you should implement proper verification)
    let decodedPayload: DecodedPayload
    try {
      // This is a simplified version - you should implement proper JWT verification
      const payloadParts = notification.signedPayload.split('.')
      if (payloadParts.length === 3) {
        const payload = JSON.parse(atob(payloadParts[1]))
        decodedPayload = payload
      } else {
        throw new Error('Invalid JWT format')
      }
    } catch (error) {
      console.error('Failed to decode payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid payload format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { notificationType, subtype, data } = decodedPayload
    console.log('Processing App Store notification:', { notificationType, subtype, data })

    // Handle different notification types
    switch (notificationType) {
      case 'CONSUMPTION_REQUEST':
        // Handle consumption request
        await handleConsumptionRequest(supabaseClient, data)
        break

      case 'DID_CHANGE_RENEWAL_PREF':
        // Handle renewal preference change
        await handleRenewalPreferenceChange(supabaseClient, data)
        break

      case 'DID_CHANGE_RENEWAL_STATUS':
        // Handle renewal status change
        await handleRenewalStatusChange(supabaseClient, data)
        break

      case 'DID_FAIL_TO_RENEW':
        // Handle failed renewal
        await handleFailedRenewal(supabaseClient, data)
        break

      case 'DID_RENEW':
        // Handle successful renewal
        await handleSuccessfulRenewal(supabaseClient, data)
        break

      case 'EXPIRED':
        // Handle expired subscription
        await handleExpiredSubscription(supabaseClient, data)
        break

      case 'GRACE_PERIOD_EXPIRED':
        // Handle grace period expiration
        await handleGracePeriodExpired(supabaseClient, data)
        break

      case 'OFFER_REDEEMED':
        // Handle offer redemption
        await handleOfferRedeemed(supabaseClient, data)
        break

      case 'PRICE_INCREASE':
        // Handle price increase
        await handlePriceIncrease(supabaseClient, data)
        break

      case 'REFUND':
        // Handle refund
        await handleRefund(supabaseClient, data)
        break

      case 'REFUND_DECLINED':
        // Handle declined refund
        await handleDeclinedRefund(supabaseClient, data)
        break

      case 'RENEWAL_EXTENDED':
        // Handle extended renewal
        await handleExtendedRenewal(supabaseClient, data)
        break

      case 'TEST':
        // Handle test notification
        console.log('Test notification received')
        break

      default:
        console.log('Unknown notification type:', notificationType)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleConsumptionRequest(supabaseClient: any, data: any) {
  // Handle consumption request for consumable products
  console.log('Consumption request:', data)
}

async function handleRenewalPreferenceChange(supabaseClient: any, data: any) {
  // Handle when user changes renewal preference
  console.log('Renewal preference changed:', data)
}

async function handleRenewalStatusChange(supabaseClient: any, data: any) {
  // Handle when renewal status changes
  console.log('Renewal status changed:', data)
}

async function handleFailedRenewal(supabaseClient: any, data: any) {
  // Handle failed renewal
  console.log('Renewal failed:', data)
  
  // Update subscription status in database
  await updateSubscriptionStatus(supabaseClient, data, 'failed')
}

async function handleSuccessfulRenewal(supabaseClient: any, data: any) {
  // Handle successful renewal
  console.log('Renewal successful:', data)
  
  // Update subscription status in database
  await updateSubscriptionStatus(supabaseClient, data, 'active')
}

async function handleExpiredSubscription(supabaseClient: any, data: any) {
  // Handle expired subscription
  console.log('Subscription expired:', data)
  
  // Update subscription status in database
  await updateSubscriptionStatus(supabaseClient, data, 'expired')
}

async function handleGracePeriodExpired(supabaseClient: any, data: any) {
  // Handle grace period expiration
  console.log('Grace period expired:', data)
  
  // Update subscription status in database
  await updateSubscriptionStatus(supabaseClient, data, 'expired')
}

async function handleOfferRedeemed(supabaseClient: any, data: any) {
  // Handle offer redemption
  console.log('Offer redeemed:', data)
}

async function handlePriceIncrease(supabaseClient: any, data: any) {
  // Handle price increase
  console.log('Price increase:', data)
}

async function handleRefund(supabaseClient: any, data: any) {
  // Handle refund
  console.log('Refund processed:', data)
  
  // Update subscription status in database
  await updateSubscriptionStatus(supabaseClient, data, 'refunded')
}

async function handleDeclinedRefund(supabaseClient: any, data: any) {
  // Handle declined refund
  console.log('Refund declined:', data)
}

async function handleExtendedRenewal(supabaseClient: any, data: any) {
  // Handle extended renewal
  console.log('Renewal extended:', data)
}

async function updateSubscriptionStatus(supabaseClient: any, data: any, status: string) {
  try {
    // Extract transaction info from the signed data
    // In a real implementation, you would properly decode and verify this
    const transactionInfo = data.signedTransactionInfo || {}
    
    // Update the subscription status
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionInfo.transactionId || 'unknown')

    if (error) {
      console.error('Failed to update subscription status:', error)
    }
  } catch (error) {
    console.error('Error updating subscription status:', error)
  }
}
