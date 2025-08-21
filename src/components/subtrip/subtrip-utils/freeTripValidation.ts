import { supabase } from '@/integrations/supabase/client';

export type TripType = 'zaproad' | 'zaptrip' | 'zapout';

interface FreeTripValidationResponse {
  can_use: boolean;
  remaining: number | null;
  next_reset: string | null;
  message: string;
  error?: string;
  details?: string;
}

export const validateFreeTrip = async (tripType: TripType): Promise<FreeTripValidationResponse> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('No active session');
    }

    const response = await fetch('https://ynvnzmkpifwteyuxondc.supabase.co/functions/v1/validate-free-trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`
      },
      body: JSON.stringify({ trip_type: tripType })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate free trip');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating free trip:', error);
    return {
      can_use: false,
      remaining: null,
      next_reset: null,
      message: 'Error validating free trip',
      error: error.message
    };
  }
};

export const recordFreeTrip = async (tripType: TripType, tripId: string): Promise<void> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('No active session');
    }

    const response = await fetch('https://ynvnzmkpifwteyuxondc.supabase.co/functions/v1/validate-free-trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`
      },
      body: JSON.stringify({ 
        trip_type: tripType,
        trip_id: tripId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to record free trip');
    }
  } catch (error) {
    console.error('Error recording free trip:', error);
    throw error;
  }
};

export const getTripTypeFromActivity = (activityType: string): TripType | null => {
  switch (activityType) {
    case 'roadtrip':
      return 'zaproad';
    case 'plan-trip':
      return 'zaptrip';
    case 'tinder-date':
    case 'friends':
      return 'zapout';
    default:
      return null;
  }
}; 