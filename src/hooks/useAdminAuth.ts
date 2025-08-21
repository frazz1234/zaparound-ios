import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function useAdminAuth(options = { redirectIfNotAdmin: true }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (options.redirectIfNotAdmin) {
          navigate('/auth');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, options.redirectIfNotAdmin]);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (options.redirectIfNotAdmin) {
          navigate('/auth');
        }
        return { isAuthorized: false };
      }
      
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
      
      if (isAdminError) {
        console.error("Error checking admin role with RPC:", isAdminError);
        setIsAdmin(false);
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!roleError && roleData) {
          setUserRole(roleData.role);
          
          if (roleData.role === 'nosubs' && options.redirectIfNotAdmin) {
            navigate('/dashboard');
            toast({
              title: t('navigation.subscriptionRequired'),
              description: t('navigation.upgradeForDashboard'),
              variant: "destructive",
            });
            return { isAuthorized: true, userId: user.id };
          }
          
          if (roleData.role === 'tier1' || roleData.role === 'tier2' || roleData.role === 'tier3') {
            await getProfile(user.id);
            return { isAuthorized: true, userId: user.id };
          }
        }
        
        if (options.redirectIfNotAdmin) {
          navigate('/');
          toast({
            title: "Access denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
        }
        return { isAuthorized: false };
      }
      
      const isUserAdmin = !!isAdminData;
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin && options.redirectIfNotAdmin) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!roleError && roleData) {
          setUserRole(roleData.role);
          
          if (roleData.role === 'tier1' || roleData.role === 'tier2' || roleData.role === 'tier3') {
            await getProfile(user.id);
            return { isAuthorized: true, userId: user.id };
          }
        }
        
        navigate('/');
        toast({
          title: t('navigation.accessDenied'),
          description: t('navigation.permissionError'),
          variant: "destructive",
        });
        return { isAuthorized: false };
      }
      
      await getProfile(user.id);
      return { isAuthorized: isUserAdmin, userId: user.id };
    } catch (error) {
      console.error('Error checking auth status:', error);
      if (options.redirectIfNotAdmin) {
        navigate('/auth');
      }
      return { isAuthorized: false };
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url`)
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const checkIsAdmin = async (): Promise<boolean> => {
    try {
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
      
      if (isAdminError) {
        console.error("Error checking admin status:", isAdminError);
        return false;
      }
      
      return !!isAdminData;
    } catch (error) {
      console.error("Error in checkIsAdmin:", error);
      return false;
    }
  };

  return { loading, isAdmin, profile, checkIsAdmin, userRole };
}
