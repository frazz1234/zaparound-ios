
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function useStripePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  const initiateCheckout = async (plan: string, isYearly: boolean) => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth if not logged in
        toast({
          title: t('common.error'),
          description: t('common.signInRequired'),
          variant: "destructive",
        });
        return { success: false, url: '/auth' };
      }
      
      console.log(`Initiating checkout for plan: ${plan}, user: ${user.id}, yearly: ${isYearly}`);
      
      // Call our edge function to create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          plan,
          userId: user.id,
          email: user.email,
          isYearly
        }
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: t('common.error'),
          description: error.message || t('common.paymentError'),
          variant: "destructive",
        });
        return { success: false };
      }
      
      console.log('Checkout session created:', data.sessionId);
      
      // Return the checkout URL
      return { 
        success: true, 
        url: data.url,
        sessionId: data.sessionId
      };
    } catch (error: any) {
      console.error('Error in initiateCheckout:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.paymentError'),
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to check payment status
  const checkPaymentStatus = async (sessionId: string) => {
    try {
      console.log(`Checking payment status for session: ${sessionId}`);
      
      // Get current user to verify role is updated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return { success: false, error: 'User not authenticated' };
      }
      
      // Call the edge function to check payment status
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { 
          sessionId,
          userId: user.id 
        }
      });
      
      if (error) {
        console.error('Error checking payment status:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Payment status response:', data);
      
      // Check if payment was not successful
      if (data.status !== 'paid') {
        console.log('Payment was not successful, ensuring user has nosubs role');
        
        // Ensure user has nosubs role for failed payments
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: 'nosubs', updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating user role to nosubs:', updateError);
        }
      }
      
      // Also check user_roles table directly to verify role
      if (user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleError) {
          console.error('Error getting user role from database:', roleError);
        } else {
          console.log(`User role from database: ${roleData.role}`);
          // If data.role from the edge function doesn't match roleData.role, use the one from the database
          if (data.role && data.role !== roleData.role) {
            console.warn(`Role mismatch: API returned ${data.role} but database has ${roleData.role}`);
            data.role = roleData.role;
          }
        }
      }
      
      // For subscription details, check additional subscription status issues
      if (data.subscriptionDetails) {
        const { status } = data.subscriptionDetails;
        if (['canceled', 'unpaid', 'incomplete_expired'].includes(status)) {
          console.log(`Subscription status is ${status}, should have nosubs role`);
          
          // Double-check that user has nosubs role for problematic subscription statuses
          const { data: currentRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
            
          if (currentRole && currentRole.role !== 'nosubs') {
            console.log(`User should have nosubs role but has ${currentRole.role}, updating...`);
            
            const { error: updateError } = await supabase
              .from('user_roles')
              .update({ role: 'nosubs', updated_at: new Date().toISOString() })
              .eq('user_id', user.id);
              
            if (updateError) {
              console.error('Error updating user role to nosubs:', updateError);
            } else {
              data.role = 'nosubs';
            }
          }
        }
      }
      
      return { 
        success: true, 
        status: data.status, 
        role: data.role,
        subscription: data.subscription,
        subscriptionDetails: data.subscriptionDetails
      };
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    initiateCheckout,
    checkPaymentStatus,
    isLoading
  };
}
