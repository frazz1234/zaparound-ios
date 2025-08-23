import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  status: 'active' | 'inactive' | 'pending';
  owner_id: string;
}

interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
}

export function useBusinessAuth() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');

  useEffect(() => {
    checkBusinessAuth();
  }, []);

  const checkBusinessAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        navigate('/login');
        return;
      }

      // Check if user owns a business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          // No business found
          setError('No business found');
          navigate('/business/create');
        } else {
          setError(businessError.message);
        }
        return;
      }

      setBusiness(businessData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isBusinessOwner = (businessId: string) => {
    return business?.id === businessId;
  };

  const isBusinessMember = async (businessId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .single();

      return !memberError && !!memberData;
    } catch {
      return false;
    }
  };

  return {
    business,
    isLoading,
    error,
    isBusinessOwner,
    isBusinessMember,
    checkBusinessAuth
  };
} 