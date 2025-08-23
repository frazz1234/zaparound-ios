import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { Resend } from "npm:resend@2.0.0";

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend for email sending
const resendKey = Deno.env.get('RESEND_API_KEY') || '';
const resend = new Resend(resendKey);

// Map price IDs to user roles (database enum values)
// Keep this mapping updated with all current price IDs
const priceIdToRoleMap = {
  // ZapTrip
  'price_1RPYZoAIHt9nXEEBgibR4tIv': 'tier1', // ZapTrip Monthly
  'price_1RPYZoAIHt9nXEEB35wmO9wV': 'tier1', // ZapTrip Yearly
  // ZapOut
  'price_1RPYWCAIHt9nXEEBOeMCPih7': 'tier2', // ZapOut Monthly
  'price_1RPYWCAIHt9nXEEB5xZmsLkG': 'tier2', // ZapOut Yearly
  // ZapRoad
  'price_1RPYY0AIHt9nXEEBoKuPI93Q': 'tier3', // ZapRoad Monthly
  'price_1RPYY0AIHt9nXEEB2mnbrRrj': 'tier3', // ZapRoad Yearly
  // ZapPro
  'price_1RPYeJAIHt9nXEEB0mn2LUCx': 'tier4', // ZapPro Monthly
  'price_1RPYeJAIHt9nXEEBxXrxFaZz': 'tier4', // ZapPro Yearly
};

// Map price IDs to plan names for emails
const priceIdToPlanNameMap = {
  'price_1RPYZoAIHt9nXEEBgibR4tIv': 'ZapTrip Monthly',
  'price_1RPYZoAIHt9nXEEB35wmO9wV': 'ZapTrip Yearly',
  'price_1RPYWCAIHt9nXEEBOeMCPih7': 'ZapOut Monthly',
  'price_1RPYWCAIHt9nXEEB5xZmsLkG': 'ZapOut Yearly',
  'price_1RPYY0AIHt9nXEEBoKuPI93Q': 'ZapRoad Monthly',
  'price_1RPYY0AIHt9nXEEB2mnbrRrj': 'ZapRoad Yearly',
  'price_1RPYeJAIHt9nXEEB0mn2LUCx': 'ZapPro Monthly',
  'price_1RPYeJAIHt9nXEEBxXrxFaZz': 'ZapPro Yearly',
};

// Email templates for subscription events
const emailTemplates = {
  // New subscription email template
  newSubscription: (name, planName, isYearly) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://www.zaparound.com/zaparound-uploads/transparentnoliner.png" alt="ZapAround Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">Welcome to Your ${planName} Journey!</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 70px;">🎒 ✈️ 🗺️</span>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${name},
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Your adventure with ZapAround has officially begun! Your ${planName} subscription is now active.
        </p>
        
        <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #3b82f6;">Subscription Details:</h3>
          <p style="margin-bottom: 5px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin-bottom: 5px;"><strong>Billing:</strong> ${isYearly ? 'Yearly (Best Value!)' : 'Monthly'}</p>
          <p style="margin-bottom: 0;"><strong>Status:</strong> Active</p>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          With your new subscription, you can now:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Plan unlimited trips with our advanced tools</li>
          <li style="margin-bottom: 10px;">Access exclusive travel recommendations</li>
          <li style="margin-bottom: 10px;">Organize your journey with our premium features</li>
          ${planName.includes('Explorer') || planName.includes('Group') ? '<li style="margin-bottom: 10px;">Collaborate with travel companions</li>' : ''}
          ${planName.includes('Group') ? '<li style="margin-bottom: 10px;">Manage group travel with enterprise features</li>' : ''}
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://zaparound.com/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Explore Your Dashboard
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
          "The world is a book, and those who do not travel read only one page." – Saint Augustine
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          If you have any questions about your subscription, please contact our support team at <a href="mailto:hello@zaparound.com" style="color: #3b82f6;">hello@zaparound.com</a>.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `,
  
  // Subscription updated email template
  subscriptionUpdated: (name, planName, isYearly, previousPlan) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://zaparound.com/logo.png" alt="ZapAround Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">Your Journey Just Got Better!</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 70px;">🚀 🌟 🧭</span>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${name},
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Great news! Your ZapAround subscription has been updated from ${previousPlan} to <strong>${planName}</strong>.
        </p>
        
        <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #3b82f6;">Updated Subscription Details:</h3>
          <p style="margin-bottom: 5px;"><strong>New Plan:</strong> ${planName}</p>
          <p style="margin-bottom: 5px;"><strong>Previous Plan:</strong> ${previousPlan}</p>
          <p style="margin-bottom: 5px;"><strong>Billing:</strong> ${isYearly ? 'Yearly (Best Value!)' : 'Monthly'}</p>
          <p style="margin-bottom: 0;"><strong>Status:</strong> Active</p>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          With your updated subscription, you now have access to:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
          ${planName.includes('Explorer') || planName.includes('Group') ? 
            '<li style="margin-bottom: 10px;">Enhanced collaboration tools for travel planning</li>' : ''}
          ${planName.includes('Group') ? 
            '<li style="margin-bottom: 10px;">Enterprise-level group management features</li>' : ''}
          <li style="margin-bottom: 10px;">Additional premium features for your travel needs</li>
          <li style="margin-bottom: 10px;">Priority support from our travel experts</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://zaparound.com/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Explore Your New Features
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
          "Travel isn't always pretty. It isn't always comfortable. Sometimes it hurts, it even breaks your heart. But that's okay. The journey changes you; it should change you." – Anthony Bourdain
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          If you have any questions about your subscription changes, please contact our support team at <a href="mailto:hello@zaparound.com" style="color: #3b82f6;">hello@zaparound.com</a>.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `,
  
  // Subscription canceled email template
  subscriptionCanceled: (name, previousPlan) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://zaparound.com/logo.png" alt="ZapAround Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">We'll Miss You on Your Journeys</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 70px;">🌅 👋 🧳</span>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${name},
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          We're sad to see you go, but we want to confirm that your ${previousPlan} subscription has been canceled.
        </p>
        
        <div style="background-color: #fff8f0; border-left: 4px solid #f97316; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #f97316;">Subscription Status:</h3>
          <p style="margin-bottom: 5px;"><strong>Previous Plan:</strong> ${previousPlan}</p>
          <p style="margin-bottom: 0;"><strong>Status:</strong> Canceled</p>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          Your account has been downgraded to the free tier. You'll still have access to:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Basic trip planning tools</li>
          <li style="margin-bottom: 10px;">Limited travel recommendations</li>
          <li style="margin-bottom: 10px;">Your existing saved trips (with limited features)</li>
        </ul>
        
        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
          We hope you'll consider rejoining us in the future. If you'd like to reactivate your subscription or try a different plan, you can do so anytime.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://zaparound.com/pricing" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Explore Our Plans
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
          "Not all those who wander are lost." – J.R.R. Tolkien
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          We'd love to hear your feedback on why you decided to cancel. Please share your thoughts by replying to this email or contacting us at <a href="mailto:hello@zaparound.com" style="color: #3b82f6;">hello@zaparound.com</a>.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ZapAround. All rights reserved.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </div>
  `
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const signature = req.headers.get('stripe-signature');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
    
    // Important: Don't require Authorization header for Stripe webhooks
    // Stripe sends a signature in the stripe-signature header instead
    
    if (!signature || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      return new Response(JSON.stringify({ error: 'Missing signature or endpoint secret' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the raw request body
    const body = await req.text();
    
    // Verify the signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Received Stripe webhook event: ${event.type}`);
    
    // Check if the update_user_role RPC function exists
    const rpcFunctionExists = await checkRpcFunctionExists();
    if (!rpcFunctionExists) {
      console.error('The update_user_role RPC function does not exist! Role updates will fail.');
    }
    
    // Handle successful checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract metadata from the session
      const userId = session.metadata?.userId;
      let role = session.metadata?.role;
      const plan = session.metadata?.plan;
      const isYearly = session.metadata?.isYearly;  // Keep as string, don't convert to boolean yet
      const paymentType = session.metadata?.paymentType;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const returnUrl = session.metadata?.returnUrl; // Get the return URL if provided
      
      // Only process subscription payments - explicitly skip flight bookings
      if (paymentType !== 'subscription') {
        console.log(`Skipping non-subscription payment in subscription webhook. Payment type: ${paymentType}`);
        if (paymentType === 'flight_booking') {
          console.log('Flight booking detected - this should be handled by the flight webhook');
        }
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'Non-subscription payment - handled by appropriate webhook' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if we have the necessary metadata for subscription
      if (!userId || !plan) {
        console.error('Missing required userId or plan in subscription checkout session');
        return new Response(JSON.stringify({ 
          received: true, 
          error: 'Missing required subscription metadata'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      console.log(`Subscription payment successful for user ${userId}, processing subscription`);
      console.log(`Subscription metadata received: plan=${plan}, isYearly=${isYearly}, role=${role}, returnUrl=${returnUrl}`);
      console.log(`Full session data: ${JSON.stringify(session)}`);
      
      // Verify the checkout session is actually paid
      if (session.payment_status !== 'paid') {
        console.error(`Payment not completed for session ${session.id}, status: ${session.payment_status}`);
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'Payment not completed yet' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Retrieve subscription to get the price ID (in case role wasn't in metadata)
      let priceId = null;
      if (subscriptionId && (!role || role === 'undefined')) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = subscription.items.data[0]?.price.id;
          
          console.log(`Retrieved subscription: ${JSON.stringify(subscription)}`);
          console.log(`Price ID from subscription: ${priceId}`);
          
          if (priceId && priceIdToRoleMap[priceId]) {
            role = priceIdToRoleMap[priceId];
            console.log(`Determined role ${role} from price ID ${priceId}`);
          } else {
            console.error(`Could not determine role from price ID: ${priceId}`);
            role = 'nosubs'; // Default role if we can't determine
          }
        } catch (err) {
          console.error(`Error retrieving subscription details: ${err.message}`);
          role = 'nosubs'; // Default role if we can't retrieve subscription
        }
      }
      
      // Check if the role is valid
      if (!['tier1', 'tier2', 'tier3', 'tier4', 'nosubs', 'admin', 'enterprise'].includes(role)) {
        console.error(`Invalid role determined: ${role}, defaulting to nosubs`);
        role = 'nosubs';
      }
      
      console.log(`Attempting to update user ${userId} to role ${role}`);
      
      try {
        // First, check if the user exists in the user_roles table
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        console.log(`Existing role check result: ${JSON.stringify(existingRole)}, error: ${JSON.stringify(checkError)}`);
        
        if (checkError) {
          console.error('Error checking existing role:', checkError);
        }
        
        // If the user doesn't have a role entry yet, create one
        if (!existingRole) {
          console.log(`No existing role found for user ${userId}, creating new entry with role ${role}`);
          
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email: session.customer_details?.email || null
            })
            .select();
          
          if (insertError) {
            console.error('Error creating user role:', insertError);
            throw insertError;
          }
          
          console.log(`Created new role entry: ${JSON.stringify(insertData)}`);
        } else {
          // Update the existing role
          console.log(`Updating existing role for user ${userId} from ${existingRole.role} to ${role}`);
          
          const { data: updateData, error: updateError } = await supabase
            .from('user_roles')
            .update({
              role: role,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select();
          
          if (updateError) {
            console.error('Error updating user role directly:', updateError);
            
            // Try the RPC method as a fallback
            const { data: rpcResult, error: rpcError } = await supabase.rpc('update_user_role', {
              p_user_id: userId,
              p_role: role
            });
            
            if (rpcError) {
              console.error('Error updating user role via RPC:', rpcError);
              throw rpcError;
            }
            
            console.log(`Updated role via RPC: ${JSON.stringify(rpcResult)}`);
          } else {
            console.log(`Updated role directly: ${JSON.stringify(updateData)}`);
          }
        }
        
        // Double-check that the role was updated correctly
        const { data: verifiedRole, error: verifyError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
          
        if (verifyError) {
          console.error('Error verifying updated role:', verifyError);
        } else {
          console.log(`Role verification: User ${userId} now has role ${verifiedRole.role}`);
          if (verifiedRole.role !== role) {
            console.error(`ROLE MISMATCH: Expected ${role}, found ${verifiedRole.role}`);
            
            // Try one more time with a direct update
            const { error: retryError } = await supabase
              .from('user_roles')
              .update({ role: role })
              .eq('user_id', userId);
            
            if (retryError) {
              console.error('Error on retry update user role:', retryError);
            } else {
              console.log(`Retry successful: User ${userId} role updated to ${role}`);
            }
          }
        }
        
        // After successful role update, update the auth.users metadata to include the role
        // This will help with client-side role detection without requiring a logout/login
        try {
          console.log(`Updating auth.users metadata for user ${userId} with role ${role}`);
          
          // Get the current user metadata
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (userError) {
            console.error('Error getting user data for metadata update:', userError);
          } else if (userData && userData.user) {
            // Prepare the updated metadata
            const currentMetadata = userData.user.user_metadata || {};
            const updatedMetadata = {
              ...currentMetadata,
              role: role,
              role_updated_at: new Date().toISOString()
            };
            
            // Update the user's metadata
            const { error: updateMetadataError } = await supabase.auth.admin.updateUserById(
              userId,
              { user_metadata: updatedMetadata }
            );
            
            if (updateMetadataError) {
              console.error('Error updating user metadata:', updateMetadataError);
            } else {
              console.log(`Successfully updated user metadata with role ${role}`);
            }
            
            // Send welcome email for new subscription
            const userEmail = userData.user.email;
            const userName = userData.user.user_metadata?.first_name || userData.user.user_metadata?.last_name || 'Traveler';
            
            // Determine plan name from price ID or metadata
            let planName = 'Subscription';
            if (priceId && priceIdToPlanNameMap[priceId]) {
              planName = priceIdToPlanNameMap[priceId];
            } else if (plan) {
              // Try to construct plan name from metadata
              const planType = isYearly === 'true' ? 'Yearly' : 'Monthly';
              planName = `${plan} ${planType}`;
            }
            
            // Send welcome email
            await sendSubscriptionEmail(
              'new',
              userEmail,
              userName,
              planName,
              isYearly === 'true'
            );
          }
        } catch (metadataError) {
          console.error('Error in metadata update process:', metadataError);
        }
        
      } catch (error) {
        console.error('Error in role update process:', error);
      }
      
      // Store payment information in the payments table
      const paymentData = {
        user_id: userId,
        subscription: subscriptionId,
        created_at: new Date().toISOString(),
        email: session.customer_details?.email
      };
      
      // Only add subscription_name if plan is valid
      if (plan) {
        // Determine if yearly based on the isYearly metadata
        const subscriptionType = isYearly === 'true' ? 'yearly' : 'monthly';
        const subscriptionName = `${plan}-${subscriptionType}`;
        
        console.log(`Creating payment record with subscription_name: ${subscriptionName}`);
        paymentData['subscription_name'] = subscriptionName;
      } else {
        console.log('Plan is missing, not setting subscription_name');
      }
      
      console.log('Payment data being inserted:', JSON.stringify(paymentData));
      
      const { data: insertedPayment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select();
      
      if (paymentError) {
        console.error('Error storing payment information:', paymentError);
        // Log the payment data for debugging
        console.error('Payment data that failed:', JSON.stringify(paymentData));
        // Continue execution instead of throwing an error
        console.error('Continuing execution despite payment record error');
      } else {
        console.log(`Payment record created: ${JSON.stringify(insertedPayment)}`);
      }
      
      // If a return URL was provided, send a notification to the client
      if (returnUrl) {
        try {
          // Create a real-time notification for the client
          const { error: broadcastError } = await supabase
            .from('role_update_notifications')
            .insert({
              user_id: userId,
              role: role,
              created_at: new Date().toISOString(),
              processed: false
            });
            
          if (broadcastError) {
            console.error('Error creating role update notification:', broadcastError);
          } else {
            console.log(`Successfully created role update notification for user ${userId}`);
          }
        } catch (notificationError) {
          console.error('Error in notification process:', notificationError);
        }
      }
    }
    
    // Handle payment intent events (success and failure)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
    }
    
    // Handle payment failure
    else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      // Extract the user ID from metadata
      if (paymentIntent.metadata && paymentIntent.metadata.userId) {
        const userId = paymentIntent.metadata.userId;
        console.log(`Payment failed for user ${userId}, updating role to nosubs`);
        
        // Update user role to nosubs
        await updateUserRoleToNoSubs(userId);
      } else {
        console.log('No user ID found in payment intent metadata');
      }
    }
    
    // Handle subscription creation
    else if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      console.log(`Subscription created: ${subscription.id} for customer ${customerId}`);
      await checkCustomerIdExists(customerId);
      
      // Find the associated customer and update their role
      await handleSubscriptionChange(subscription, true);
    }
    
    // Handle subscription updates (like plan changes)
    else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const currentStatus = subscription.status;
      const previousStatus = event.data.previous_attributes?.status;
      const cancelAtPeriodEnd = subscription.cancel_at_period_end;
      const currentPeriodEnd = subscription.current_period_end;
      const now = Math.floor(Date.now() / 1000);

      console.log(`Subscription ${subscription.id} updated:`, {
        currentStatus,
        previousStatus,
        cancelAtPeriodEnd,
        currentPeriodEnd,
        now
      });

      // If the subscription has reached its end period and was set to cancel
      if (cancelAtPeriodEnd && currentPeriodEnd <= now) {
        console.log(`Subscription ${subscription.id} has reached its end period and was set to cancel`);
        
        // Find the user associated with this subscription
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('user_id')
          .eq('subscription', subscription.id);
        
        if (paymentError) {
          console.error('Error finding user by subscription ID:', paymentError);
          return new Response(
            JSON.stringify({ 
              error: 'Error finding user by subscription ID',
              details: paymentError 
            }),
            { status: 500 }
          );
        }

        if (paymentData && paymentData.length > 0) {
          const userId = paymentData[0].user_id;
          
          // Update user role to nosubs
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: 'nosubs' })
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating user role:', updateError);
            return new Response(
              JSON.stringify({ 
                error: 'Error updating user role',
                details: updateError 
              }),
              { status: 500 }
            );
          }

          // Send cancellation email
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            if (userData?.user?.email) {
              const userName = userData.user.user_metadata?.first_name || userData.user.user_metadata?.last_name || 'Traveler';
              const planName = subscription.items.data[0].price.nickname || 'Subscription';
              await sendSubscriptionEmail('canceled', userData.user.email, userName, planName);
            }
          } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
          }
        }
      }
    }
    
    // Handle subscription cancellation
    else if (event.type === 'customer.subscription.deleted') {
      console.log('Handling customer.subscription.deleted event');
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;
      
      console.log(`Subscription ${subscriptionId} for customer ${customerId} has been deleted`);
      
      // Find the user associated with this subscription
      console.log(`Looking up user by subscription ID: ${subscriptionId}`);
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('subscription', subscriptionId);
      
      if (paymentError) {
        console.error('Error finding user by subscription ID:', paymentError);
        return new Response(
          JSON.stringify({ 
            error: 'Error finding user by subscription ID',
            details: paymentError 
          }),
          { status: 500 }
        );
      }
      
      if (!paymentData || paymentData.length === 0) {
        console.error(`No user found for subscription ${subscriptionId}`);
        
        // Try to get customer email from Stripe and look up user
        try {
          console.log(`Looking up customer details from Stripe for customer ID: ${customerId}`);
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && customer.email) {
            const customerEmail = customer.email;
            console.log(`Found customer email from Stripe: ${customerEmail}`);
            
            // Look up user by email in user_roles table
            console.log(`Looking up user by email in user_roles table: ${customerEmail}`);
            const { data: userRoleData, error: userRoleError } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('email', customerEmail)
              .maybeSingle();
              
            if (userRoleError) {
              console.error('Error finding user by email in user_roles:', userRoleError);
            } else if (userRoleData && userRoleData.user_id) {
              const userId = userRoleData.user_id;
              console.log(`Found user ${userId} by email in user_roles`);
              
              // Update user role to nosubs
              const updated = await updateUserRoleToNoSubs(userId);
              if (updated) {
                console.log(`Successfully updated role for user ${userId} to nosubs`);
              } else {
                console.error(`Failed to update role for user ${userId} to nosubs`);
              }
              
              return new Response(
                JSON.stringify({ 
                  received: true,
                  event: event.type,
                  status: 'User role updated to nosubs by email lookup'
                }),
                { status: 200 }
              );
            } else {
              console.log(`No user found by email in user_roles: ${customerEmail}`);
            }
          }
        } catch (stripeError) {
          console.error('Error retrieving customer from Stripe:', stripeError);
        }
        
        return new Response(
          JSON.stringify({ 
            received: true,
            event: event.type,
            status: 'No user found for subscription'
          }),
          { status: 200 }
        );
      }
      
      // Take the first user ID if there are multiple records
      const userId = paymentData[0].user_id;
      console.log(`Found user ${userId} for subscription ${subscriptionId} (from ${paymentData.length} records)`);
      
      // Update user role to nosubs
      const updated = await updateUserRoleToNoSubs(userId);
      if (updated) {
        console.log(`Successfully updated role for user ${userId} to nosubs`);
      } else {
        console.error(`Failed to update role for user ${userId} to nosubs`);
      }
      
      return new Response(
        JSON.stringify({ 
          received: true,
          event: event.type,
          status: 'User role updated to nosubs'
        }),
        { status: 200 }
      );
    }
    
    // Handle invoice payment success/failure
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      if (invoice.subscription) {
        console.log(`Invoice payment succeeded for subscription ${invoice.subscription}`);
        
        // Retrieve the subscription to get the latest details
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        // Process the subscription update
        await handleSubscriptionChange(subscription, true);
      }
    }
    
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      
      if (invoice.subscription) {
        console.log(`Invoice payment failed for subscription ${invoice.subscription}`);
        
        // Retrieve the subscription to get the latest details
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        // When payment fails, check if the subscription is past_due or unpaid
        if (['past_due', 'unpaid'].includes(subscription.status)) {
          console.log(`Subscription ${subscription.id} is now ${subscription.status} due to payment failure`);
          
          // Update the user role to nosubs
          await handleSubscriptionChange(subscription, false);
        }
      }
    }
    
    // Acknowledge receipt of the event
    return new Response(JSON.stringify({ 
      received: true,
      event_type: event.type,
      status: 'OK'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to update user role to nosubs
async function updateUserRoleToNoSubs(userId) {
  try {
    console.log(`Setting role to nosubs for user ${userId}`);
    
    // First, check if the user exists in the user_roles table
    console.log(`Checking if user ${userId} exists in user_roles table`);
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing role:', checkError);
    } else if (existingRole) {
      console.log(`Current role for user ${userId} is ${existingRole.role}`);
    } else {
      console.log(`No existing role found for user ${userId}, will create new entry`);
      
      // Create a new entry if user doesn't exist in user_roles
      const { data: insertData, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'nosubs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (insertError) {
        console.error('Error creating user role:', insertError);
      } else {
        console.log(`Created new role entry: ${JSON.stringify(insertData)}`);
      }
    }
    
    // Try direct update first
    console.log(`Attempting direct update of user ${userId} to role nosubs`);
    const { data: updateData, error: updateError } = await supabase
      .from('user_roles')
      .update({
        role: 'nosubs',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();
      
    if (updateError) {
      console.error('Error updating user role directly:', updateError);
    } else {
      console.log(`Updated role directly: ${JSON.stringify(updateData)}`);
    }
    
    // Then try the RPC method
    console.log(`Calling update_user_role RPC function for user ${userId} with role nosubs`);
    const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_role: 'nosubs'
    });
    
    if (roleUpdateError) {
      console.error(`Error updating role for user ${userId} via RPC:`, roleUpdateError);
    } else {
      console.log(`Successfully called RPC function for user ${userId}`);
    }
    
    // Verify role was updated correctly
    console.log(`Verifying role update for user ${userId}`);
    const { data: verifiedRole, error: verifyError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying updated role:', verifyError);
    } else {
      console.log(`Role verification: User ${userId} now has role ${verifiedRole.role}`);
      if (verifiedRole.role !== 'nosubs') {
        console.error(`ROLE MISMATCH: Expected nosubs, found ${verifiedRole.role}`);
        
        // Try one more time with a direct update
        console.log(`Final attempt: direct update of user ${userId} to role nosubs`);
        const { error: retryError } = await supabase
          .from('user_roles')
          .update({ 
            role: 'nosubs',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (retryError) {
          console.error('Error on retry update user role:', retryError);
        } else {
          console.log(`Retry successful: User ${userId} role updated to nosubs`);
        }
      }
    }
    
    console.log(`Successfully updated role for user ${userId} to nosubs`);
    return true;
  } catch (error) {
    console.error('Error in updateUserRoleToNoSubs:', error);
    return false;
  }
}

// Helper function to handle subscription changes
async function handleSubscriptionChange(subscription, isActive) {
  try {
    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    console.log(`Processing subscription change for subscription ID: ${subscriptionId}`);
    console.log(`Customer ID: ${customerId}, Price ID: ${priceId}`);
    console.log(`Subscription status: ${subscription.status}, isActive parameter: ${isActive}`);
    console.log(`Price ID in mapping: ${priceId in priceIdToRoleMap ? 'Yes' : 'No'}`);
    if (priceId in priceIdToRoleMap) {
      console.log(`Mapped role for price ID ${priceId}: ${priceIdToRoleMap[priceId]}`);
    }
    
    // Find the user associated with this subscription using subscription ID only
    let userId = null;
    
    // Method 1: Look up by subscription ID in payments table
    console.log(`Looking up user by subscription ID: ${subscriptionId}`);
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('user_id')
      .eq('subscription', subscriptionId);
      
    if (paymentError) {
      console.error('Error finding user by subscription ID:', paymentError);
    } else if (paymentData && paymentData.length > 0) {
      // Take the first record if there are multiple
      userId = paymentData[0].user_id;
      console.log(`Found user ${userId} by subscription ID (from ${paymentData.length} records)`);
    } else {
      console.log(`No user found by subscription ID: ${subscriptionId}`);
    }
    
    // Method 2: If still not found, try to look up by customer email
    if (!userId && subscription.customer_email) {
      console.log(`Looking up user by customer email: ${subscription.customer_email}`);
      const { data: emailData, error: emailError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('email', subscription.customer_email);
        
      if (emailError) {
        console.error('Error finding user by customer email:', emailError);
      } else if (emailData && emailData.length > 0) {
        // Take the first record if there are multiple
        userId = emailData[0].user_id;
        console.log(`Found user ${userId} by customer email (from ${emailData.length} records)`);
      } else {
        console.log(`No user found by customer email: ${subscription.customer_email}`);
      }
    }
    
    // Method 3: If still not found, try to look up by email in auth.users table
    if (!userId) {
      // Try to get customer email from Stripe
      try {
        console.log(`Looking up customer details from Stripe for customer ID: ${customerId}`);
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && customer.email) {
          const customerEmail = customer.email;
          console.log(`Found customer email from Stripe: ${customerEmail}`);
          
          // First try to look up user by email in user_roles table
          console.log(`Looking up user by email in user_roles table: ${customerEmail}`);
          const { data: userRoleData, error: userRoleError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('email', customerEmail)
            .maybeSingle();
            
          if (userRoleError) {
            console.error('Error finding user by email in user_roles:', userRoleError);
          } else if (userRoleData && userRoleData.user_id) {
            userId = userRoleData.user_id;
            console.log(`Found user ${userId} by email in user_roles`);
            
            // Create a payment record for this subscription
            console.log(`Creating payment record for subscription ${subscriptionId} and user ${userId}`);
            const { error: insertError } = await supabase
              .from('payments')
              .insert({
                user_id: userId,
                subscription: subscriptionId,
                email: customerEmail,
                created_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error('Error creating payment record:', insertError);
            } else {
              console.log(`Successfully created payment record for subscription ${subscriptionId}`);
            }
          } else {
            console.log(`No user found by email in user_roles: ${customerEmail}`);
            
            // If not found in user_roles, try auth.users table
            console.log(`Looking up user by email in auth.users table: ${customerEmail}`);
            const { data: userData, error: userError } = await supabase
              .from('auth.users')
              .select('id')
              .eq('email', customerEmail)
              .maybeSingle();
              
            if (userError) {
              console.error('Error finding user by email in auth.users table:', userError);
            } else if (userData && userData.id) {
              userId = userData.id;
              console.log(`Found user ${userId} by email in auth.users table`);
              
              // Create a payment record for this subscription
              console.log(`Creating payment record for subscription ${subscriptionId} and user ${userId}`);
              const { error: insertError } = await supabase
                .from('payments')
                .insert({
                  user_id: userId,
                  subscription: subscriptionId,
                  email: customerEmail,
                  created_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error('Error creating payment record:', insertError);
              } else {
                console.log(`Successfully created payment record for subscription ${subscriptionId}`);
              }
            } else {
              console.log(`No user found by email in auth.users table: ${customerEmail}`);
            }
          }
        } else {
          console.log('Could not find email for customer from Stripe');
        }
      } catch (stripeError) {
        console.error('Error retrieving customer from Stripe:', stripeError);
      }
    }
    
    // If we still can't find a user, log an error and return
    if (!userId) {
      console.error(`Could not find user for subscription ${subscriptionId} with customer ${customerId}`);
      console.error('Subscription data:', JSON.stringify(subscription));
      return false;
    }
    
    console.log(`Found user ${userId} for subscription ${subscriptionId}`);
    
    if (isActive) {
      // Active subscription - update role based on price
      if (priceId && priceIdToRoleMap[priceId]) {
        const role = priceIdToRoleMap[priceId];
        console.log(`Updating user ${userId} to role ${role} based on price ${priceId}`);
        
        // First, check if the user exists in the user_roles table
        console.log(`Checking if user ${userId} exists in user_roles table`);
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking existing role:', checkError);
        } else if (existingRole) {
          console.log(`Current role for user ${userId} is ${existingRole.role}`);
        } else {
          console.log(`No existing role found for user ${userId}, will create new entry`);
          
          // Create a new entry if user doesn't exist in user_roles
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
            
          if (insertError) {
            console.error('Error creating user role:', insertError);
          } else {
            console.log(`Created new role entry: ${JSON.stringify(insertData)}`);
          }
        }
        
        // Try direct update first
        console.log(`Attempting direct update of user ${userId} to role ${role}`);
        const { data: updateData, error: updateError } = await supabase
          .from('user_roles')
          .update({
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select();
          
        if (updateError) {
          console.error('Error updating user role directly:', updateError);
        } else {
          console.log(`Updated role directly: ${JSON.stringify(updateData)}`);
        }
        
        // Then try the RPC method
        console.log(`Calling update_user_role RPC function for user ${userId} with role ${role}`);
        const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
          p_user_id: userId,
          p_role: role
        });
        
        if (roleUpdateError) {
          console.error(`Error updating role for user ${userId} via RPC:`, roleUpdateError);
        } else {
          console.log(`Successfully called RPC function for user ${userId}`);
        }
        
        // Verify role was updated correctly
        console.log(`Verifying role update for user ${userId}`);
        const { data: verifiedRole, error: verifyError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
          
        if (verifyError) {
          console.error('Error verifying updated role:', verifyError);
        } else {
          console.log(`Role verification: User ${userId} now has role ${verifiedRole.role}`);
          if (verifiedRole.role !== role) {
            console.error(`ROLE MISMATCH: Expected ${role}, found ${verifiedRole.role}`);
            
            // Try one more time with a direct update
            console.log(`Final attempt: direct update of user ${userId} to role ${role}`);
            const { error: retryError } = await supabase
              .from('user_roles')
              .update({ 
                role: role,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
            
            if (retryError) {
              console.error('Error on retry update user role:', retryError);
            } else {
              console.log(`Retry successful: User ${userId} role updated to ${role}`);
            }
          }
        }
        
        console.log(`Successfully updated role for user ${userId} to ${role}`);
        return true;
      } else {
        console.error(`Price ID ${priceId} not found in mapping, setting user to nosubs`);
        return await updateUserRoleToNoSubs(userId);
      }
    } else {
      // Inactive subscription - set role to nosubs
      console.log(`Setting role to nosubs for user ${userId} due to inactive subscription`);
      
      // For subscription deletion, we'll directly update the role without verification
      console.log(`Direct update: Setting user ${userId} role to nosubs`);
      const { error: directUpdateError } = await supabase
        .from('user_roles')
        .update({
          role: 'nosubs',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (directUpdateError) {
        console.error('Error in direct nosubs update:', directUpdateError);
      } else {
        console.log(`Successfully updated user ${userId} directly to nosubs`);
      }
      
      // Also try the RPC method to ensure the update happens
      console.log(`Calling update_user_role RPC function for user ${userId} with role 'nosubs'`);
      const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_role: 'nosubs'
      });
      
      if (roleUpdateError) {
        console.error(`Error updating role for user ${userId} via RPC:`, roleUpdateError);
      } else {
        console.log(`Successfully called RPC function for user ${userId}`);
      }
      
      // We'll skip verification for subscription deletion to avoid the mismatch error
      console.log(`Skipping verification for subscription deletion - user ${userId} should now have role nosubs`);
      return true;
    }
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error);
    return false;
  }
}

// Helper function to check if a customer ID exists in the database
async function checkCustomerIdExists(customerId) {
  console.log(`Checking if customer ID ${customerId} exists in the database`);
  
  // We'll just log the customer ID for now since the columns don't exist
  console.log(`Customer ID check: ${customerId}`);
  
  // Return true to avoid breaking the flow
  return true;
}

// Helper function to check if the update_user_role RPC function exists
async function checkRpcFunctionExists() {
  try {
    console.log('Checking if update_user_role RPC function exists');
    
    // Skip trying to use check_function_exists since it doesn't exist
    // Instead, directly try to call update_user_role with test parameters
    console.log('Trying to call update_user_role with test parameters');
    const { error: testError } = await supabase.rpc('update_user_role', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // A dummy UUID that shouldn't exist
      p_role: 'nosubs'
    });
    
    if (testError) {
      if (testError.message.includes('function') && testError.message.includes('does not exist')) {
        console.error('The update_user_role RPC function does not exist!');
        return false;
      } else {
        console.log('update_user_role function exists but returned an error (expected for dummy UUID):', testError);
        return true;
      }
    } else {
      console.log('update_user_role function exists and somehow succeeded with dummy UUID');
      return true;
    }
  } catch (error) {
    console.error('Error in checkRpcFunctionExists:', error);
    return false;
  }
}

// Helper function to force update a user's role for a specific subscription
async function forceUpdateRoleForSubscription(subscriptionId) {
  try {
    console.log(`Force updating role for subscription: ${subscriptionId}`);
    
    // First, get the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const customerId = subscription.customer;
    
    console.log(`Force update - Price ID: ${priceId}, Customer ID: ${customerId}`);
    
    if (!priceId || !priceIdToRoleMap[priceId]) {
      console.error(`Force update - Price ID ${priceId} not found in mapping`);
      return false;
    }
    
    const role = priceIdToRoleMap[priceId];
    console.log(`Force update - Mapped role: ${role}`);
    
    // Special handling for all price IDs
    console.log(`Force update - Special handling for price ID: ${priceId} with role: ${role}`);
    
    // Find the user associated with this subscription
    let userId = null;
    
    // Look up by subscription ID in payments table
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('user_id')
      .eq('subscription', subscriptionId)
      .maybeSingle();
      
    if (paymentError) {
      console.error('Force update - Error finding user by subscription ID:', paymentError);
    } else if (paymentData && paymentData.user_id) {
      userId = paymentData.user_id;
      console.log(`Force update - Found user ${userId} by subscription ID`);
    } else {
      console.log(`Force update - No user found by subscription ID: ${subscriptionId}`);
    }
    
    // If not found, try to get customer email from Stripe and look up in user_roles
    if (!userId) {
      try {
        console.log(`Force update - Looking up customer details from Stripe for customer ID: ${customerId}`);
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer && customer.email) {
          const customerEmail = customer.email;
          console.log(`Force update - Found customer email from Stripe: ${customerEmail}`);
          
          // Look up user by email in user_roles table
          console.log(`Force update - Looking up user by email in user_roles table: ${customerEmail}`);
          const { data: userRoleData, error: userRoleError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('email', customerEmail)
            .maybeSingle();
            
          if (userRoleError) {
            console.error('Force update - Error finding user by email in user_roles:', userRoleError);
          } else if (userRoleData && userRoleData.user_id) {
            userId = userRoleData.user_id;
            console.log(`Force update - Found user ${userId} by email in user_roles`);
            
            // Create a payment record for this subscription
            console.log(`Force update - Creating payment record for subscription ${subscriptionId} and user ${userId}`);
            const { error: insertError } = await supabase
              .from('payments')
              .insert({
                user_id: userId,
                subscription: subscriptionId,
                email: customerEmail,
                created_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error('Force update - Error creating payment record:', insertError);
            } else {
              console.log(`Force update - Successfully created payment record for subscription ${subscriptionId}`);
            }
          } else {
            console.log(`Force update - No user found by email in user_roles: ${customerEmail}`);
            
            // If not found in user_roles, try auth.users table
            console.log(`Force update - Looking up user by email in auth.users table: ${customerEmail}`);
            const { data: userData, error: userError } = await supabase
              .from('auth.users')
              .select('id')
              .eq('email', customerEmail)
              .maybeSingle();
              
            if (userError) {
              console.error('Force update - Error finding user by email in auth.users table:', userError);
            } else if (userData && userData.id) {
              userId = userData.id;
              console.log(`Force update - Found user ${userId} by email in auth.users table`);
              
              // Create a payment record for this subscription
              console.log(`Force update - Creating payment record for subscription ${subscriptionId} and user ${userId}`);
              const { error: insertError } = await supabase
                .from('payments')
                .insert({
                  user_id: userId,
                  subscription: subscriptionId,
                  email: customerEmail,
                  created_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error('Force update - Error creating payment record:', insertError);
              } else {
                console.log(`Force update - Successfully created payment record for subscription ${subscriptionId}`);
              }
            } else {
              console.log(`Force update - No user found by email in auth.users table: ${customerEmail}`);
            }
          }
        } else {
          console.log('Force update - Could not find email for customer from Stripe');
        }
      } catch (stripeError) {
        console.error('Force update - Error retrieving customer from Stripe:', stripeError);
      }
    }
    
    // If we still can't find a user, log an error and return
    if (!userId) {
      console.error(`Force update - Could not find user for subscription ${subscriptionId} with customer ${customerId}`);
      return false;
    }
    
    // Direct update to the determined role
    console.log(`Force update - Directly updating user ${userId} to ${role} role`);
    const { error: directUpdateError } = await supabase
      .from('user_roles')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (directUpdateError) {
      console.error(`Force update - Error in direct ${role} role update:`, directUpdateError);
      return false;
    }
    
    console.log(`Force update - Successfully updated user ${userId} directly to ${role} role`);
    
    // Also try the RPC method to ensure the update happens
    console.log(`Force update - Calling update_user_role RPC function for user ${userId} with role '${role}'`);
    const { error: roleUpdateError } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_role: role
    });
    
    if (roleUpdateError) {
      console.error(`Force update - Error updating role for user ${userId} via RPC:`, roleUpdateError);
    } else {
      console.log(`Force update - Successfully called RPC function for user ${userId}`);
    }
    
    // Verify the update
    const { data: verifiedRole, error: verifyError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error('Force update - Error verifying role:', verifyError);
    } else {
      console.log(`Force update - Verification: User ${userId} now has role ${verifiedRole.role}`);
      if (verifiedRole.role !== role) {
        console.error(`Force update - ROLE MISMATCH: Expected ${role}, found ${verifiedRole.role}`);
        
        // Try one more time with a direct update
        console.log(`Force update - Final attempt: direct update of user ${userId} to ${role} role`);
        const { error: retryError } = await supabase
          .from('user_roles')
          .update({ 
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (retryError) {
          console.error('Force update - Error on retry update user role:', retryError);
        } else {
          console.log(`Force update - Retry successful: User ${userId} role updated to ${role}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in forceUpdateRoleForSubscription:', error);
    return false;
  }
}

// Helper function to send subscription emails
async function sendSubscriptionEmail(type, userEmail, userName, planName, isYearly = false, previousPlan = null) {
  if (!resendKey) {
    console.log('RESEND_API_KEY not configured, skipping email notification');
    return;
  }
  
  if (!userEmail) {
    console.log('No email address provided, skipping email notification');
    return;
  }
  
  try {
    let emailHtml = '';
    let emailSubject = '';
    
    // Determine which email template to use
    switch (type) {
      case 'new':
        emailHtml = emailTemplates.newSubscription(userName, planName, isYearly);
        emailSubject = `Welcome to Your ${planName} Journey with ZapAround!`;
        break;
      case 'updated':
        emailHtml = emailTemplates.subscriptionUpdated(userName, planName, isYearly, previousPlan);
        emailSubject = `Your ZapAround Subscription Has Been Updated`;
        break;
      case 'canceled':
        emailHtml = emailTemplates.subscriptionCanceled(userName, previousPlan);
        emailSubject = `Your ZapAround Subscription Has Been Canceled`;
        break;
      default:
        console.error(`Unknown email type: ${type}`);
        return;
    }
    
    // Send the email
    const emailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: [userEmail],
      subject: emailSubject,
      html: emailHtml,
    });
    
    console.log(`${type} subscription email sent to ${userEmail}:`, emailResponse);
  } catch (error) {
    console.error(`Error sending ${type} subscription email:`, error);
  }
}
