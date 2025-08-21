/**
 * Utility functions for sending data to webhooks
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Send trip data to the Make.com webhook via Supabase Edge Function
 */
export async function sendTripToWebhook(tripData: any) {
  try {
    console.log('🔍 Trip data received in webhook:', {
      trip_type: tripData.trip_type,
      id: tripData.id,
      title: tripData.title
    });

    // Get user email from the database if it's not already provided
    
    // Make sure we have at least a basic profile data object


    // Determine the webhook type based on trip type
    const webhookType = tripData.trip_type?.toLowerCase() || 'zaptrip';
    
    console.log(`📤 Sending webhook payload to make-webhook/${webhookType}`);
    console.log("📦 Webhook payload:", JSON.stringify(tripData, null, 2));
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(`make-webhook/${webhookType}`, {
      body: tripData
    });

    if (error) {
      console.error("❌ Failed to send data to webhook:", error);
      return false;
    } else {
      console.log("✅ Successfully sent trip data to webhook");
      return true;
    }
  } catch (webhookError) {
    console.error("Error sending data to webhook:", webhookError);
    return false;
  }
}

/**
 * Prepare webhook payload for a standard trip
 */
export function prepareTripWebhookPayload(tripResult: any) {
  console.log("Preparing standard trip webhook payload from result:", JSON.stringify(tripResult, null, 2));
  
  // Get auth user email if available in trip result
  let userEmail = '';
  if (tripResult.email) {
    userEmail = tripResult.email;
  } else if (tripResult.profile_data?.email) {
    userEmail = tripResult.profile_data.email;
  }
  
  // Ensure we have complete profile data
  const profileData = tripResult.profile_data || {};
  
  // Make sure the email is included in profile data
  if (userEmail && profileData && !profileData.email) {
    profileData.email = userEmail;
  }
  
  // Parse transportation and accommodation details if they exist
  let transportationMode = tripResult.transportation_mode || '';
  let transportationDetails = '';
  if (tripResult.transportation_details) {
    if (typeof tripResult.transportation_details === 'string') {
      try {
        const parsedDetails = JSON.parse(tripResult.transportation_details);
        transportationMode = parsedDetails.mode || transportationMode;
        transportationDetails = parsedDetails.details || '';
      } catch (e) {
        console.error("Error parsing transportation details:", e);
      }
    } else {
      transportationMode = tripResult.transportation_details.mode || transportationMode;
      transportationDetails = tripResult.transportation_details.details || '';
    }
  }
  
  let accommodationType = tripResult.accommodation_type || '';
  let accommodationDetails = '';
  if (tripResult.accommodation_details) {
    if (typeof tripResult.accommodation_details === 'string') {
      try {
        const parsedDetails = JSON.parse(tripResult.accommodation_details);
        accommodationType = parsedDetails.type || accommodationType;
        accommodationDetails = parsedDetails.details || '';
      } catch (e) {
        console.error("Error parsing accommodation details:", e);
      }
    } else {
      accommodationType = tripResult.accommodation_details.type || accommodationType;
      accommodationDetails = tripResult.accommodation_details.details || '';
    }
  }

  // Parse coordinates if they exist
  let coordinates = null;
  if (tripResult.coordinates) {
    try {
      coordinates = typeof tripResult.coordinates === 'string' 
        ? JSON.parse(tripResult.coordinates)
        : tripResult.coordinates;
    } catch (e) {
      console.error("Error parsing coordinates:", e);
    }
  }

  // Parse departure coordinates if they exist
  let departureCoordinates = null;
  if (tripResult.departure_coordinates) {
    try {
      departureCoordinates = typeof tripResult.departure_coordinates === 'string' 
        ? JSON.parse(tripResult.departure_coordinates)
        : tripResult.departure_coordinates;
    } catch (e) {
      console.error("Error parsing departure coordinates:", e);
    }
  }
  
  const payload = {
    trip_id: tripResult.id,
    title: tripResult.title,
    description: tripResult.description,
    location: tripResult.location,
    coordinates: coordinates,
    start_date: tripResult.start_date,
    end_date: tripResult.end_date,
    category: tripResult.category,
    budget: parseFloat(tripResult.budget || '0'),
    currency: tripResult.currency || 'USD',
    transportation_mode: transportationMode,
    transportation_details: transportationDetails,
    accommodation_type: accommodationType,
    accommodation_details: accommodationDetails,
    adults: tripResult.adults,
    kids: tripResult.kids,
    trip_type: tripResult.trip_type,
    user_id: tripResult.user_id,
    user_email: userEmail,
    // Include notes if available
    notes: tripResult.notes || '',
    // Add complete profile information
    profile: profileData,
    // Add ZapTrip specific information
    departure_location: tripResult.departure_location || '',
    departure_coordinates: departureCoordinates,
    interests: Array.isArray(tripResult.interests) ? tripResult.interests : [],
    has_pets: tripResult.has_pets || false
  };
  
  console.log("Final standard trip webhook payload:", JSON.stringify(payload, null, 2));
  return payload;
}

/**
 * Prepare webhook payload for a ZapOut trip
 */
export function prepareZapOutWebhookPayload(zapOutResult: any) {
  console.log("Preparing ZapOut webhook payload from result:", JSON.stringify(zapOutResult, null, 2));
  
  // Get auth user email if available in trip result
  let userEmail = '';
  if (zapOutResult.email) {
    userEmail = zapOutResult.email;
  } else if (zapOutResult.profile_data?.email) {
    userEmail = zapOutResult.profile_data.email;
  }
  
  // Ensure we have complete profile data
  const profileData = zapOutResult.profile_data || {};
  
  // Make sure the email is included in profile data
  if (userEmail && profileData && !profileData.email) {
    profileData.email = userEmail;
  }
  
  // Ensure arrays are defined and properly formatted
  const activityTimes = Array.isArray(zapOutResult.activity_times) ? zapOutResult.activity_times : [];
  const activityTypes = Array.isArray(zapOutResult.activity_types) ? zapOutResult.activity_types : [];
  const requestedActivities = Array.isArray(zapOutResult.requested_activities) ? zapOutResult.requested_activities : [];
  
  // Parse coordinates if they exist
  let coordinates = null;
  if (zapOutResult.coordinates) {
    try {
      coordinates = typeof zapOutResult.coordinates === 'string' 
        ? JSON.parse(zapOutResult.coordinates)
        : zapOutResult.coordinates;
    } catch (e) {
      console.error("Error parsing coordinates:", e);
    }
  }

  // Ensure date is properly formatted
  let formattedDate = null;
  if (zapOutResult.date) {
    try {
      formattedDate = new Date(zapOutResult.date).toISOString();
    } catch (e) {
      console.error("Error formatting date:", e);
    }
  }
  
  // Format the payload with explicit values
  const payload = {
    zapout_id: zapOutResult.id || '',
    trip_id: zapOutResult.trip_id || '',
    title: zapOutResult.title || '',
    description: zapOutResult.description || '',
    location: zapOutResult.location || '',
    coordinates: coordinates,
    date: formattedDate,// Add end_date for consistency (same as date for single-day events)
    user_id: zapOutResult.user_id || '',
    user_email: userEmail,
    trip_type: 'ZapOut',
    // Complete profile information 
    profile: profileData,
    // Include notes if available
    notes: zapOutResult.notes || '',
    // ZapOut specific data with explicit values
    activity_times: activityTimes,
    activity_types: activityTypes,
    requested_activities: requestedActivities,
    budget_per_person: zapOutResult.budget_per_person || '',
    min_budget: parseFloat(zapOutResult.min_budget || '0'),
    max_budget: parseFloat(zapOutResult.max_budget || '500'),
    currency: zapOutResult.currency || 'USD',
    currency_symbol: zapOutResult.currency_symbol || '$',
    additional_needs: zapOutResult.additional_needs || '',
    accessibility_needs: zapOutResult.accessibility_needs || '',
    adults: zapOutResult.adults || 1,
    kids: zapOutResult.kids || 0,
  };
  
  console.log("Final ZapOut webhook payload:", JSON.stringify(payload, null, 2));
  return payload;
}

/**
 * Prepare webhook payload for a ZapRoad trip
 */
export function prepareZapRoadWebhookPayload(zapRoadResult: any) {
  // Get auth user email if available in trip result
  let userEmail = '';
  if (zapRoadResult.email) {
    userEmail = zapRoadResult.email;
  } else if (zapRoadResult.profile_data?.email) {
    userEmail = zapRoadResult.profile_data.email;
  }
  
  // Parse the stopover cities if it's a string and extract just the names for Make.com
  let stopoverCitiesString = '';
  if (zapRoadResult.stopover_cities) {
    try {
      // Parse the outer array first
      const parsedCities = typeof zapRoadResult.stopover_cities === 'string' 
        ? JSON.parse(zapRoadResult.stopover_cities) 
        : zapRoadResult.stopover_cities;
      
      // Extract just the city names and join them with commas
      stopoverCitiesString = parsedCities.map((city: any) => city.name).join(' ; ');
      
      console.log('Stopover cities string for Make:', stopoverCitiesString);
    } catch (e) {
      console.error("Error parsing stopover cities:", e);
    }
  }

  const payload = {
    zaproad_id: zapRoadResult.id,
    trip_id: zapRoadResult.trip_id || '',
    title: zapRoadResult.title || '',
    description: zapRoadResult.description || '',
    location: zapRoadResult.location || '',
    starting_city: zapRoadResult.starting_city || '',
    end_city: zapRoadResult.end_city || '',
    start_date: zapRoadResult.start_date || null,
    end_date: zapRoadResult.end_date || null,
    user_id: zapRoadResult.user_id,
    user_email: userEmail,
    trip_type: 'ZapRoad',
    // Only include profile, not profile_data
    profile: zapRoadResult.profile_data || {},
    // ZapRoad specific data
    starting_city_coordinates: zapRoadResult.starting_city_coordinates,
    stopover_cities: stopoverCitiesString, // Now just a comma-separated string
    end_city_coordinates: zapRoadResult.end_city_coordinates,
    number_of_people: zapRoadResult.number_of_people,
    adults: zapRoadResult.adults || 1,
    kids: zapRoadResult.kids || 0,
    has_electric_car: zapRoadResult.has_electric_car,
    car_type: zapRoadResult.car_type || '',
    interests: Array.isArray(zapRoadResult.interests) ? zapRoadResult.interests : [],
    has_pets: zapRoadResult.has_pets === true,
    special_requirements: zapRoadResult.special_requirements || '',
    // Include budget and currency information
    budget: typeof zapRoadResult.budget === 'number' ? zapRoadResult.budget : parseFloat(zapRoadResult.budget || '0'),
    currency: zapRoadResult.currency || 'USD',
    currency_symbol: zapRoadResult.currency_symbol || '$',
    category: zapRoadResult.category || '',
    // Include notes if available
    notes: zapRoadResult.notes || ''
  };
  
  return payload;
}
