import { useState } from "react";
import { useToast } from "./use-toast";
import { createStandardTrip } from "@/utils/tripCreation";
import { createZapOutTrip } from "@/utils/zapOutCreation";
import { createZapRoadTrip } from "@/utils/zapRoadCreation";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { TripFormData } from "@/types/trip";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { invalidateTripCaches, removeHomepageCreateTripCache } from "@/utils/cache";

export { type TripFormData } from "@/types/trip";

interface CreateTripCallbacks {
  onSuccess?: (tripId?: string) => void;
  onError?: (error: Error) => void;
}

export function useCreateTrip(onSuccess?: (() => void) | CreateTripCallbacks, onError?: (error: Error) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();

  // Handle callbacks in different formats
  const getCallbacks = (): CreateTripCallbacks => {
    if (typeof onSuccess === 'function') {
      return { onSuccess, onError };
    }
    return onSuccess || {};
  };

  const createTrip = async (formData: TripFormData) => {
    try {
      setIsLoading(true);
      
      console.log("useCreateTrip - Starting trip creation with data:", JSON.stringify(formData, null, 2));
      
      // Fetch the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("useCreateTrip - No authenticated user found");
        throw new Error("No authenticated user found");
      }
      
      console.log("useCreateTrip - Found authenticated user:", JSON.stringify(user, null, 2));
      console.log("useCreateTrip - Creating trip with type:", formData.tripType);
      
      // Fetch the user's profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log("useCreateTrip - Fetched profile data:", JSON.stringify(profileData, null, 2));
      
      let result;
      
      // Ensure tripType is the correct type
      const tripType = formData.tripType as "ZapTrip" | "ZapOut" | "ZapRoad";
      
      // Different creation logic based on trip type
      if (tripType === 'ZapOut') {
        // Ensure all required fields are present for ZapOut
        const zapOutData = {
          ...formData,
          tripType: 'ZapOut' as const,
          activityTimes: formData.activityTimes || [],
          activityTypes: formData.activityTypes || [],
          includeLunch: formData.includeLunch || false,
          includeBudgetPerPerson: formData.includeBudgetPerPerson || false,
          lunchOption: formData.lunchOption || 'before',
          budgetPerPerson: formData.budgetPerPerson || '',
          additionalNeeds: formData.additionalNeeds || ''
        };
        
        console.log("useCreateTrip - Creating ZapOut trip with processed data:", JSON.stringify(zapOutData, null, 2));
        result = await createZapOutTrip(zapOutData, user, profileData);
      } else if (tripType === 'ZapRoad') {
        console.log("useCreateTrip - Creating ZapRoad trip with data:", JSON.stringify(formData, null, 2));
        const zapRoadData = {
          ...formData,
          tripType: 'ZapRoad' as const
        };
        result = await createZapRoadTrip(zapRoadData, user, profileData);
      } else {
        // Default to standard trip creation (ZapTrip)
        console.log("useCreateTrip - Creating standard trip with data:", JSON.stringify(formData, null, 2));
        const standardData = {
          ...formData,
          tripType: 'ZapTrip' as const
        };
        result = await createStandardTrip(standardData, user, profileData);
      }
      
      console.log("useCreateTrip - Trip created successfully:", JSON.stringify(result, null, 2));
      
      // Invalidate all trip-related caches immediately after successful creation
      await invalidateTripCaches(user.id);
      
      // Remove homepage create trip cache after successful trip creation
      removeHomepageCreateTripCache(user.id);
      
      const callbacks = getCallbacks();
      const tripId = result?.[0]?.id;
      
      if (callbacks.onSuccess) {
        callbacks.onSuccess(tripId);
      }
      
      // Check if user is already on dashboard page
      const currentLang = lang || 'en';
      const dashboardPath = `/${currentLang}/dashboard`;
      
      // If we are not already on the dashboard, navigate there. When we *are* on
      // the dashboard the "TRIP_CREATED" cache-invalidation event emitted above
      // makes `useTrips` refetch, so a hard reload isn’t necessary and would
      // actually break the dialog cleanup.
      if (location.pathname !== dashboardPath) {
        navigate(dashboardPath);
      }
       
      return result;
    } catch (error: any) {
      console.error("useCreateTrip - Error creating trip:", error);
      toast({
        title: t('trip.creation.error'),
        description: t('trip.creation.errorMessage'),
        variant: "destructive",
      });
      
      const callbacks = getCallbacks();
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createTrip,
  };
}
