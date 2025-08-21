import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { transactionId, productId, purchaseDate, userId } = await req.json()

    if (!transactionId || !productId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store transaction in database
    const { data, error } = await supabaseClient
      .from('appstore_transactions')
      .insert({
        transaction_id: transactionId,
        product_id: productId,
        purchase_date: new Date(purchaseDate).toISOString(),
        user_id: userId,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to store transaction' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user subscription status
    const subscriptionData = {
      user_id: userId,
      product_id: productId,
      status: 'active',
      transaction_id: transactionId,
      purchase_date: new Date(purchaseDate).toISOString(),
      updated_at: new Date().toISOString()
    }

    // Upsert subscription record
    const { error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })

    if (subscriptionError) {
      console.error('Subscription update error:', subscriptionError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: data,
        message: 'Transaction stored successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
