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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token to get the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const { action, passportData, encryptionKey } = await req.json()

    if (!action || !encryptionKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a unique encryption key for this user
    const userEncryptionKey = `${encryptionKey}_${user.id}_${user.email}`

    switch (action) {
      case 'store':
        if (!passportData) {
          return new Response(
            JSON.stringify({ error: 'Passport data is required for store action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Store passport data
        const { data: storeResult, error: storeError } = await supabase.rpc('store_passport_data', {
          p_user_id: user.id,
          p_passport_number: passportData.passport_number || null,
          p_passport_country: passportData.passport_country || null,
          p_passport_expiry_date: passportData.passport_expiry_date || null,
          p_encryption_key: userEncryptionKey
        })

        if (storeError) {
          console.error('Error storing passport data:', storeError)
          return new Response(
            JSON.stringify({ error: 'Failed to store passport data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Passport data stored securely',
            passport_id: storeResult 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'retrieve':
        // Retrieve passport data
        const { data: retrieveResult, error: retrieveError } = await supabase.rpc('get_passport_data', {
          p_user_id: user.id,
          p_encryption_key: userEncryptionKey
        })

        if (retrieveError) {
          console.error('Error retrieving passport data:', retrieveError)
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve passport data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!retrieveResult || retrieveResult.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'No passport data found',
              passport_data: null 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Passport data retrieved successfully',
            passport_data: retrieveResult[0] 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'delete':
        // Delete passport data
        const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_passport_data', {
          p_user_id: user.id
        })

        if (deleteError) {
          console.error('Error deleting passport data:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete passport data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Passport data deleted successfully',
            deleted: deleteResult 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use store, retrieve, or delete' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in secure-passport function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 