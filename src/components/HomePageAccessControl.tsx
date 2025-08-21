import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { hasHomepageCreateTripCache } from '@/utils/cache';

interface HomePageAccessControlProps {
  children: React.ReactNode;
  session: any;
}

export function HomePageAccessControl({ children, session }: HomePageAccessControlProps) {
  const navigate = useNavigate();
  const { lang } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasActiveCache, setHasActiveCache] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!session) {
        // No session, allow access to homepage
        setIsChecking(false);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Check if user is admin
        const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
        
        if (isAdminError) {
          console.error("Error checking admin role:", isAdminError);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!isAdminData);
        }

        // Check if user has active homepage create trip cache
        let userHasActiveCache = false;
        if (user) {
          userHasActiveCache = hasHomepageCreateTripCache(user.id);
          setHasActiveCache(userHasActiveCache);
        }

        // Allow access if user is admin OR has active homepage create trip cache
        if (isAdminData || userHasActiveCache) {
          // User is admin or has active cache, allow access to homepage
          setIsChecking(false);
          return;
        }

        // If user is not admin and has no active cache, redirect to dashboard
        const currentLang = lang || 'en';
        navigate(`/${currentLang}/dashboard`, { replace: true });
        return;
      } catch (error) {
        console.error('Error checking user access:', error);
        // On error, redirect to dashboard for safety
        const currentLang = lang || 'en';
        navigate(`/${currentLang}/dashboard`, { replace: true });
      }
    };

    checkAccess();
  }, [session, navigate, lang]);

  // Show loading while checking
  if (isChecking && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#61936f] mx-auto mb-4"></div>
          <p className="text-[#62626a]">Checking access...</p>
        </div>
      </div>
    );
  }

  // If no session, user is admin, or user has active cache, show the homepage
  return <>{children}</>;
}
