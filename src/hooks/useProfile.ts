import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { userCache, getOrSetCache } from '@/utils/cache';
import { Profile } from '@/types/profile';

export function useProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [emailChangeInProgress, setEmailChangeInProgress] = useState(false);

  // Check if email verification is still pending
  useEffect(() => {
    const checkEmailChangeStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at && session?.user?.new_email) {
          setEmailChangeInProgress(true);
        }
      } catch (error) {
        console.error("Error checking email change status:", error);
      }
    };
    
    checkEmailChangeStatus();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      console.log("Fetching profile for user:", user.id);
      
      const profileData = await getOrSetCache(
        userCache,
        `profile-${user.id}`,
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching profile:', error);
            throw error;
          }
          
          if (data) {
            return {
              ...data,
              medical_conditions: data.medical_conditions || [],
              dietary_preferences: data.dietary_preferences || [],
              disabilities: data.disabilities || [],
              allergies: data.allergies || [],
              lgbtq_status: data.lgbtq_status || [],
              language: data.language || 'en',
              newsletter_subscribed: data.newsletter_subscribed ?? true,
              email: data.email || user.email // Use database email, fallback to auth email
            };
          }
          return null;
        },
        { ttl: 1000 * 60 * 15 } // 15 minutes TTL
      );
      
      if (profileData) {
        setProfile(profileData);
        if (profileData.birth_date) {
          const [year, month, day] = profileData.birth_date.split('-').map(Number);
          setDate(new Date(year, month - 1, day));
        }
      }
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Clear the cache for this user's profile
      userCache.delete(`profile-${user.id}`);
      
      // Refresh the profile data
      await getProfile();
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncNewsletterSubscription = async (userId: string, email: string, subscribed: boolean) => {
    try {
      // Use the Edge Function to manage subscription
      await supabase.functions.invoke('manage-newsletter', {
        body: { 
          email, 
          userId,
          subscribed 
        }
      });
    } catch (error) {
      console.error('Error syncing newsletter subscription:', error);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  return {
    profile,
    setProfile,
    loading,
    date,
    setDate,
    updateProfile,
    emailChangeInProgress
  };
}
