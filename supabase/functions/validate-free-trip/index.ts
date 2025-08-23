import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user's session
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    if (userError) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Authentication error', details: userError.message }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get request body
    const body = await req.json()
    const { trip_type, trip_id } = body

    if (!trip_type || !['zaproad', 'zaptrip', 'zapout'].includes(trip_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid trip type', received: trip_type }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has a subscription
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError) {
      console.error('Error getting user role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Error checking subscription status', details: roleError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If user has a subscription, they don't need to use free trips
    if (userRole && userRole.role !== 'nosubs') {
      return new Response(
        JSON.stringify({ 
          can_use: true,
          remaining: null,
          next_reset: null,
          message: 'User has active subscription'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user can use a free trip
    const { data: canUse, error: canUseError } = await supabaseClient
      .rpc('can_use_free_trip', {
        p_user_id: user.id,
        p_trip_type: trip_type
      })

    if (canUseError) {
      console.error('Error checking free trip usage:', canUseError)
      return new Response(
        JSON.stringify({ error: 'Error checking free trip usage', details: canUseError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get remaining free trips
    const { data: remaining, error: remainingError } = await supabaseClient
      .rpc('get_remaining_free_trips', {
        p_user_id: user.id,
        p_trip_type: trip_type
      })

    if (remainingError) {
      console.error('Error getting remaining trips:', remainingError)
      return new Response(
        JSON.stringify({ error: 'Error getting remaining trips', details: remainingError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get next reset date
    const { data: nextReset, error: nextResetError } = await supabaseClient
      .rpc('get_next_free_trips_reset', {
        p_user_id: user.id,
        p_trip_type: trip_type
      })

    if (nextResetError) {
      console.error('Error getting next reset date:', nextResetError)
      return new Response(
        JSON.stringify({ error: 'Error getting next reset date', details: nextResetError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If user can use a free trip and trip_id is provided, record it
    if (canUse && trip_id) {
      const { data: freeTripId, error: recordError } = await supabaseClient
        .rpc('record_free_trip', {
          p_user_id: user.id,
          p_email: user.email,
          p_trip_type: trip_type,
          p_trip_id: trip_id
        })

      if (recordError) {
        console.error('Error recording free trip:', recordError)
        return new Response(
          JSON.stringify({ error: 'Error recording free trip', details: recordError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          can_use: true,
          remaining: remaining - 1,
          next_reset: nextReset,
          message: `Free trip recorded. You have ${remaining - 1} free trips remaining this month.`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If user can't use a free trip, return appropriate message
    return new Response(
      JSON.stringify({ 
        can_use: false,
        remaining: remaining,
        next_reset: nextReset,
        message: remaining === 0 
          ? 'You have used all 3 free trips this month. Please upgrade to continue creating trips.'
          : `You have ${remaining} free trips remaining this month.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 