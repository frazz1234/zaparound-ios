/**
 * Utility functions for creating standard trips
 */
import { supabase } from "@/integrations/supabase/client";
import { sendTripToWebhook, prepareTripWebhookPayload } from "./webhook";
import { TripFormData } from "@/types/trip";

/**
 * Create a standard trip in the database
 */
export async function createStandardTrip(
  formData: TripFormData, 
  user: any, 
  profileData: any
) {
  // Ensure we have complete profile data
  let completeProfileData = profileData;
  
  // If profile data is missing or incomplete, fetch it from the database
  if (!profileData || Object.keys(profileData).length === 0) {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && userData) {
        completeProfileData = userData;
      }
    } catch (error) {
      console.error("Error fetching complete profile data:", error);
    }
  }
  
  // Add email to profile data
  completeProfileData = {
    ...completeProfileData,
    email: user.email
  };
  
  // Format the data for the database
  const tripData = {
    user_id: user.id,
    title: formData.title,
    description: formData.description,
    location: formData.location,
    coordinates: JSON.stringify(formData.coordinates),
    start_date: formData.startDate?.toISOString(),
    end_date: formData.endDate?.toISOString(),
    category: formData.category,
    budget: parseFloat(formData.budget),
    currency: formData.currency || 'USD',
    transportation_details: {
      mode: formData.transportationMode,
      details: formData.transportationDetails,
    },
    accommodation_details: {
      type: formData.accommodationType,
      details: formData.accommodationDetails,
    },
    notes: formData.notes || '',
    adults: formData.adults,
    kids: formData.kids,
    trip_type: formData.tripType,
    profile_data: completeProfileData,
    // Add ZapTrip specific fields
    interests: formData.interests || [],
    has_pets: formData.hasPets || false,
    departure_location: formData.departureLocation || '',
    departure_coordinates: formData.departureCoordinates ? JSON.stringify(formData.departureCoordinates) : null
  };

  console.log("Trip data to be inserted:", tripData);

  // Insert into the database
  const { data: tripResult, error } = await supabase.from("trips").insert(tripData).select();

  if (error) {
    console.error("Error creating trip:", error);
    throw error;
  }

  console.log("Trip created successfully:", tripResult);

  // Send data to Make webhook
  if (tripResult && tripResult.length > 0) {
 
    const webhookPayload = prepareTripWebhookPayload({
      ...tripResult[0],
      email: user.email, // Add email here for webhook but it won't be stored in DB
      trip_type: 'zaptrip' // Ensure trip type is explicitly set
    });

    const webhookResult = await sendTripToWebhook(webhookPayload);
  
  }

  return tripResult;
}
