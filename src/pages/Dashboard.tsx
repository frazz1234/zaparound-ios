import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTrips } from '@/hooks/useTrips';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { getFreeTripInfo } from '@/utils/freeTripManager';
import { Button } from '@/components/ui/button';
import { getFullName, getFirstName } from '@/utils/profileUtils';

const Dashboard = () => {
  const { userRole, loading: roleLoading } = useUserRole();
  const { trips, loading: tripsLoading, getTrips, refreshTrips, deleteTrip } = useTrips();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const [hasFreeTrip, setHasFreeTrip] = useState<boolean>(false);
  const navigate = useNavigate();
  const { lang } = useParams();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    async function initialize() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await getTrips(user.id);
        await getProfile(user.id);
      }
    }
    
    initialize();
  }, [userRole]);

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`username, first_name, last_name, avatar_url`)
        .eq('id', userId)
        .single();

      if (error && error.code !== '406') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Check if this is a redirect from Stripe
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Show success toast
      toast({
        title: t('success'),
        description: t('paymentSuccess'),
      });
      
      // Remove query params to prevent showing the same toast on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast, t]);

  const handleTripCreated = async () => {
    if (userId) {
      await refreshTrips(userId);
    }
  };

  const handleDeleteTrip = async (tripId: string): Promise<boolean> => {
    console.log("Dashboard: Handling delete for trip ID:", tripId);
    try {
      const success = await deleteTrip(tripId);
      if (success) {
        console.log("Delete operation successful");
        toast({
          title: t('trip.deletion.success'),
          description: t('trip.deletion.successMessage'),
        });
      } else {
        console.error("Delete operation failed");
      }
      return success;
    } catch (error) {
      console.error("Error in handleDeleteTrip:", error);
      return false;
    }
  };

  const handleCreateTrip = () => {
    const currentLang = lang || 'en';
    navigate(`/${currentLang}/create-trip`);
  };

  // Function to get first name from profile
  const getProfileFirstName = () => {
    if (!profile) return '';
    return profile.first_name || profile.username || '';
  };

  const loading = roleLoading || tripsLoading;

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no trips
  if (trips.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              <img 
                src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMW55cDl2MGZjZmJqOWExaXRkc2ttYmRpcWJlZDN5Y202ZGFzaHR5cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VGG8UY1nEl66Y/giphy.gif"
                alt="ZapAround Animation" 
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 whitespace-nowrap">
              {t('trip.empty.welcome', { name: getProfileFirstName() })}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('trip.empty.noneYet')}
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleCreateTrip}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide px-8 py-3"
            >
              {t('trip.empty.createFirst')}
            </Button>
            
            <p className="text-sm text-gray-500">
              {t('trip.empty.description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardContent 
      loading={loading}
      trips={trips}
      fullName={getFullName(profile?.first_name, profile?.last_name)}
      onTripCreated={handleTripCreated}
      onDeleteTrip={handleDeleteTrip}
      userRole={userRole}
      hasFreeTrip={hasFreeTrip}
    />
  );
};

export default Dashboard;
