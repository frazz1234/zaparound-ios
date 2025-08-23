import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'nosubs' | 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'enterprise' | null;

/**
 * Custom hook to efficiently manage and cache user role information
 * Reduces excessive database queries by caching role data in localStorage
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch and update user role
  const fetchUserRole = async () => {
    let isMounted = true;
    
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) {
        if (isMounted) {
          setUserRole(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      
      // Make a direct RPC call to check admin status
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      
      if (!isMounted) return;
      
      if (adminError) {
        console.error("Error checking admin role:", adminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdmin);
        
        if (isAdmin) {
          setUserRole('admin');
          // Update cache
          try {
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRoleTimestamp', Date.now().toString());
          } catch (err) {
            console.error("Error updating localStorage:", err);
          }
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
      }
      
      // If not admin, get role from user_roles table
      try {
        const { data, error } = await supabase.from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!isMounted) return;
        
        if (error) {
          console.error("Error fetching user role:", error);
          setUserRole('nosubs'); // Default to basic role if error
        } else {
          const role = data?.role || 'nosubs';
          setUserRole(role as UserRole);
          
          // Update cache
          try {
            localStorage.setItem('userRole', role);
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('userRoleTimestamp', Date.now().toString());
          } catch (err) {
            console.error("Error updating localStorage:", err);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error in getUserRole query:", error);
          setUserRole('nosubs'); // Default to basic role if error
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error in getUserRole:", error);
        setUserRole('nosubs'); // Default to basic role if error
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    // Return cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    async function getUserRole() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole(null);
          setIsAdmin(false);
          return;
        }
        
        // Check cache first (with 10-minute expiry)
        const cachedRole = localStorage.getItem('userRole');
        const cachedTimestamp = localStorage.getItem('userRoleTimestamp');
        const isAdminCached = localStorage.getItem('isAdmin') === 'true';
        
        const now = Date.now();
        const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes
        
        if (cachedRole && cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_EXPIRY) {
          setUserRole(cachedRole as UserRole);
          setIsAdmin(isAdminCached);
          setLoading(false);
          return;
        }
        
        // If cache expired or not available, fetch fresh data
        await fetchUserRole();
      } catch (error) {
        console.error("Error in getUserRole:", error);
        setUserRole('nosubs'); // Default to basic role if error
        setLoading(false);
      }
    }
    
    getUserRole();
    
    // Setup auth state change listener for sign in, sign out, and other auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state change event:", event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Force refresh role immediately when user signs in
        console.log("Auth event detected, refreshing role data");
        fetchUserRole();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRoleTimestamp');
        setUserRole(null);
        setIsAdmin(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { userRole, isAdmin, loading, refreshRole: fetchUserRole };
}
