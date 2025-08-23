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

    const response = await fetch('/functions/v1/validate-free-trip', {
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

    const response = await fetch('/functions/v1/validate-free-trip', {
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

/**
 * Ensure the free trip table exists
 */
async function ensureFreeTripTableExists() {
  try {
    const { error } = await supabase
      .from('user_freenium')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Error checking free trip table:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in ensureFreeTripTableExists:", error);
    throw error;
  }
}

/**
 * Check if a user has used a free trip before
 * @param userId User ID to check
 * @param email User email (as fallback)
 * @returns True if user has used a free trip before
 */
export async function hasUsedFreeTripBefore(userId?: string, email?: string): Promise<boolean> {
  if (!userId && !email) {
    return false;
  }

  try {
    // First try using userId if available
    if (userId) {
      const { data, error } = await supabase
        .from('user_freenium')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking free trip usage by userId:", error);
        return false;
      }
      
      if (data) {
        return true;
      }
    }

    // If no result by userId or userId not provided, try with email
    if (email) {
      const { data, error } = await supabase
        .from('user_freenium')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        console.error("Error checking free trip usage by email:", error);
        return false;
      }
      
      if (data) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error in hasUsedFreeTripBefore:", error);
    return false;
  }
}

/**
 * Record a free trip usage for a user
 * @param userId User ID
 * @param email User email
 * @param tripId The ID of the trip created
 * @returns True if recording was successful
 */
export async function recordFreeTripUsage(userId: string, email: string, tripId: string): Promise<boolean> {
  try {
    // Ensure the table exists
    await ensureFreeTripTableExists();

    // Get the user's first usage date for this trip type
    const { data: existingTrip, error: checkError } = await supabase
      .from('user_freenium')
      .select('first_usage_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing trip:", checkError);
      return false;
    }

    // Insert the record
    const { error } = await supabase
      .from('user_freenium')
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        trip_id: tripId,
        created_at: new Date().toISOString(),
        first_usage_date: existingTrip?.first_usage_date || new Date().toISOString()
      });
    
    if (error) {
      console.error("Error recording free trip usage:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in recordFreeTripUsage:", error);
    return false;
  }
}

/**
 * Get free trip info for a user (if they've used one)
 * @param userId User ID to check
 * @param email User email (as fallback)
 * @returns Free trip info or null if none found
 */
export async function getFreeTripInfo(userId?: string, email?: string) {
  if (!userId && !email) {
    return null;
  }

  try {
    // First try using userId if available
    if (userId) {
      const { data, error } = await supabase
        .from('user_freenium')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error getting free trip info by userId:", error);
        return null;
      }
      
      if (data) {
        return data;
      }
    }

    // If no result by userId or userId not provided, try with email
    if (email) {
      const { data, error } = await supabase
        .from('user_freenium')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        console.error("Error getting free trip info by email:", error);
        return null;
      }
      
      if (data) {
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error("Error in getFreeTripInfo:", error);
    return null;
  }
} 