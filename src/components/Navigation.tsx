
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { MobileNavigation } from "@/components/MobileNavigation";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { useUserRole } from '@/hooks/useUserRole'; // Import the new hook

export function Navigation({ session }: { session: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole(); // Use the new hook
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <DesktopNavigation session={session} onSignOut={handleSignOut} isAdmin={isAdmin} />
      <MobileNavigation session={session} onSignOut={handleSignOut} isAdmin={isAdmin} />
    </>
  );
}
