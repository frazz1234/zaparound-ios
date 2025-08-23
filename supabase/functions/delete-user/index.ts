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
    
    // Get the user ID to delete from the request body
    let requestData
    try {
      requestData = await req.json()
    } catch (e) {
      console.error('Error parsing request body:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const userId = requestData.userId || user.id
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // We only allow users to delete their own account unless they're admin
    if (userId !== user.id) {
      // Check if requesting user is an admin - Using direct query with service role to bypass RLS
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
          JSON.stringify({ error: 'Unauthorized: You can only delete your own account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }
    
    console.log(`User ${user.id} attempting to delete user ${userId}`)
    
    try {
      // Delete ALL related data for the user
      // The order matters - start with tables that reference the user_id
      
      console.log("1. Deleting newsletter subscriptions")
      const { error: newsletterError } = await supabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('user_id', userId)
      
      if (newsletterError) console.log("Warning when deleting newsletter subscriptions:", newsletterError.message)
      
      console.log("2. Deleting post replies")
      const { error: postRepliesError } = await supabase
        .from('post_replies')
        .delete()
        .eq('user_id', userId)
      
      if (postRepliesError) console.log("Warning when deleting post replies:", postRepliesError.message)
      
      console.log("3. Getting user's posts")
      const { data: userPosts, error: postsError } = await supabase
        .from('community_posts')
        .select('id')
        .eq('user_id', userId)
      
      if (postsError) {
        console.error("Error fetching user's posts:", postsError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch user's posts: ${postsError.message}`,
            message: 'Failed to delete user data. Please try again.',
            auth_deleted: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      if (userPosts && userPosts.length > 0) {
        console.log(`4. Deleting likes for ${userPosts.length} posts`)
        const postIds = userPosts.map(post => post.id)
        const { error: postLikesError } = await supabase
          .from('post_likes')
          .delete()
          .in('post_id', postIds)
        
        if (postLikesError) {
          console.error("Error deleting post likes:", postLikesError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to delete post likes: ${postLikesError.message}`,
              message: 'Failed to delete user data. Please try again.',
              auth_deleted: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
      } else {
        console.log("4. No posts found, skipping post likes deletion")
      }
      
      console.log("5. Deleting user's post likes")
      const { error: userPostLikesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
      
      if (userPostLikesError) console.log("Warning when deleting user's post likes:", userPostLikesError.message)
      
      console.log("6. Deleting community posts")
      const { error: communityPostsError } = await supabase
        .from('community_posts')
        .delete()
        .eq('user_id', userId)
      
      if (communityPostsError) console.log("Warning when deleting community posts:", communityPostsError.message)
      
      console.log("7. Deleting trips data")
      const { error: tripsError } = await supabase
        .from('trips')
        .delete()
        .eq('user_id', userId)
      
      if (tripsError) console.log("Warning when deleting trips:", tripsError.message)
      
      console.log("8. Deleting zapout data")
      const { error: zapoutError } = await supabase
        .from('zapout_data')
        .delete()
        .eq('user_id', userId)
      
      if (zapoutError) console.log("Warning when deleting zapout data:", zapoutError.message)
      
      console.log("9. Deleting zaproad data")
      const { error: zaproadError } = await supabase
        .from('zaproad_data')
        .delete()
        .eq('user_id', userId)
      
      if (zaproadError) console.log("Warning when deleting zaproad data:", zaproadError.message)
      
      console.log("10. Deleting cookie consents")
      const { error: cookieConsentError } = await supabase
        .from('cookie_consents')
        .delete()
        .eq('user_id', userId)
      
      if (cookieConsentError) console.log("Warning when deleting cookie consents:", cookieConsentError.message)
      
      console.log("11. Deleting payments")
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('user_id', userId)
      
      if (paymentsError) console.log("Warning when deleting payments:", paymentsError.message)
      
      console.log("12. Deleting user roles")
      const { error: userRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
      
      if (userRolesError) console.log("Warning when deleting user roles:", userRolesError.message)
      
      console.log("13. Checking if profile exists")
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      
      if (profileCheckError) {
        console.log("Warning when checking profile:", profileCheckError.message)
      } else if (profileData) {
        console.log("13a. Profile exists, deleting it")
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId)
        
        if (profileError) {
          console.error("Error deleting profile:", profileError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to delete profile: ${profileError.message}`,
              message: 'Failed to delete user profile. Please try again.',
              auth_deleted: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
      } else {
        console.log("13b. Profile does not exist, skipping profile deletion")
      }
      
      // Make sure Auth user deletion is the last step
      console.log("14. Deleting the auth user (final step)")
      
      // First check if the user exists in Auth
      const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (getUserError) {
        console.error("Error checking if auth user exists:", getUserError);
        // Continue anyway, as we've already deleted all the user data
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User data deleted successfully, but could not verify auth user existence',
            auth_deleted: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      if (!authUser || !authUser.user) {
        console.log("Auth user not found, all other data has been deleted");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User data deleted successfully, but auth user was not found',
            auth_deleted: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      // User exists in Auth, proceed with deletion as the final step
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to delete auth user: ${deleteAuthError.message}`,
            message: 'User data was deleted but auth user deletion failed. The user may still appear in the admin panel.',
            auth_deleted: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      // Everything succeeded
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User deleted successfully including auth user',
          auth_deleted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (error: any) {
      console.error('Error during deletion process:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'An error occurred during deletion' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
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
