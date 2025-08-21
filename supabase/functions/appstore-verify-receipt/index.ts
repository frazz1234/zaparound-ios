import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReceiptVerificationRequest {
  receiptData: string;
  userId: string;
  productId: string;
}

interface AppStoreReceiptResponse {
  status: number;
  environment: string;
  receipt: {
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date: string;
      expires_date?: string;
      cancellation_date?: string;
      is_trial_period: string;
      is_in_intro_offer_period: string;
    }>;
    latest_receipt_info: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date: string;
      expires_date?: string;
      cancellation_date?: string;
      is_trial_period: string;
      is_in_intro_offer_period: string;
    }>;
  };
  latest_receipt_info: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date: string;
    expires_date?: string;
    cancellation_date?: string;
    is_trial_period: string;
    is_in_intro_offer_period: string;
  }>;
  pending_renewal_info: Array<{
    auto_renew_status: string;
    auto_renew_product_id: string;
    original_transaction_id: string;
    expiration_intent: string;
  }>;
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

    // Get request body
    const { receiptData, userId, productId }: ReceiptVerificationRequest = await req.json()

    if (!receiptData || !userId || !productId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify receipt with App Store
    const verificationResult = await verifyReceiptWithAppStore(receiptData)

    if (verificationResult.status !== 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Receipt verification failed', 
          status: verificationResult.status 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if the product is valid
    const isValidProduct = verificationResult.receipt.in_app.some(
      purchase => purchase.product_id === productId
    )

    if (!isValidProduct) {
      return new Response(
        JSON.stringify({ error: 'Product not found in receipt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the latest purchase info for this product
    const latestPurchase = verificationResult.latest_receipt_info
      .filter(purchase => purchase.product_id === productId)
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0]

    if (!latestPurchase) {
      return new Response(
        JSON.stringify({ error: 'No valid purchase found for product' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if subscription is still active
    const isActive = latestPurchase.expires_date && 
      new Date(latestPurchase.expires_date) > new Date()

    // Store verified transaction
    const { data: transactionData, error: transactionError } = await supabaseClient
      .from('appstore_transactions')
      .insert({
        transaction_id: latestPurchase.transaction_id,
        product_id: latestPurchase.product_id,
        purchase_date: new Date(latestPurchase.purchase_date).toISOString(),
        user_id: userId,
        status: isActive ? 'verified' : 'expired',
        original_transaction_id: latestPurchase.original_transaction_id,
        expires_date: latestPurchase.expires_date ? new Date(latestPurchase.expires_date).toISOString() : null,
        is_trial_period: latestPurchase.is_trial_period === 'true',
        is_intro_offer: latestPurchase.is_in_intro_offer_period === 'true',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to store verified transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to store transaction' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user subscription
    const subscriptionData = {
      user_id: userId,
      product_id: latestPurchase.product_id,
      status: isActive ? 'active' : 'expired',
      transaction_id: latestPurchase.transaction_id,
      original_transaction_id: latestPurchase.original_transaction_id,
      purchase_date: new Date(latestPurchase.purchase_date).toISOString(),
      expires_date: latestPurchase.expires_date ? new Date(latestPurchase.expires_date).toISOString() : null,
      is_trial_period: latestPurchase.is_trial_period === 'true',
      is_intro_offer: latestPurchase.is_in_intro_offer_period === 'true',
      updated_at: new Date().toISOString()
    }

    const { error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })

    if (subscriptionError) {
      console.error('Failed to update subscription:', subscriptionError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: transactionData,
        subscription: subscriptionData,
        isActive,
        message: 'Receipt verified successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Receipt verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function verifyReceiptWithAppStore(receiptData: string): Promise<AppStoreReceiptResponse> {
  // Use sandbox URL for testing, production URL for live
  const verifyUrl = Deno.env.get('APPSTORE_ENVIRONMENT') === 'production' 
    ? 'https://buy.itunes.apple.com/verifyReceipt'
    : 'https://sandbox.itunes.apple.com/verifyReceipt'

  const requestBody = {
    'receipt-data': receiptData,
    'password': Deno.env.get('APPSTORE_SHARED_SECRET') || '',
    'exclude-old-transactions': true
  }

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`App Store verification failed: ${response.status}`)
  }

  return await response.json()
}
