import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Only respond to POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'This endpoint only accepts POST requests' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Get the JWT from the authorization header
    const authHeader = req.headers.get('Authorization') || ''
    
    // Check for authorization header
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', details: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    console.log(`Request received from user: ${user.id}`)
    
    // Check if the requesting user is an admin
    const { data: adminRoles, error: adminCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    if (adminCheckError) {
      console.error("Error checking admin status:", adminCheckError)
      return new Response(
        JSON.stringify({ error: 'Error verifying permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const isAdmin = adminRoles && adminRoles.some(role => role.role === 'admin')
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }
    
    // Fetch all users from Auth using pagination
    let allUsers = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000 // Maximum allowed by Supabase
      })
      
      if (listUsersError) {
        console.error("Error listing users:", listUsersError)
        return new Response(
          JSON.stringify({ error: 'Error fetching users', details: listUsersError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      if (!users || users.length === 0) {
        hasMore = false;
      } else {
        allUsers = allUsers.concat(users);
        page++;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        users: allUsers.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          app_metadata: u.app_metadata,
          user_metadata: u.user_metadata
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    // Log the error on the server
    console.error('Unexpected error:', error)
    
    // Return a generic error to the client
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}); 