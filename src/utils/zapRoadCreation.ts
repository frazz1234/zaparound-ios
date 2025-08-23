/**
 * Utility functions for creating ZapRoad trips
 */
import { supabase } from "@/integrations/supabase/client";
import { sendTripToWebhook, prepareZapRoadWebhookPayload } from "./webhook";
import { TripFormData } from "@/types/trip";

/**
 * Create a ZapRoad trip in the database
 */
export async function createZapRoadTrip(
  formData: TripFormData, 
  user: any, 
  profileData: any
) {
  // For ZapRoad trips, generate a UUID to use as trip_id
  const tripId = crypto.randomUUID();
  
  console.log("Creating ZapRoad with form data:", JSON.stringify(formData, null, 2));
  
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
  
  // Parse stopover cities data from the form
  const stopoverCitiesData = formData.stopoverCities || [];
  
  // Format complete profile data to ensure all fields are properly formatted
  const formattedProfileData = {
    language: completeProfileData?.language || '',
    disabilities: Array.isArray(completeProfileData?.disabilities) ? completeProfileData.disabilities : [],
    medical_conditions: Array.isArray(completeProfileData?.medical_conditions) ? completeProfileData.medical_conditions : [],
    allergies: Array.isArray(completeProfileData?.allergies) ? completeProfileData.allergies : [],
    lgbtq_status: Array.isArray(completeProfileData?.lgbtq_status) ? completeProfileData.lgbtq_status : [],
    dietary_preferences: Array.isArray(completeProfileData?.dietary_preferences) ? completeProfileData.dietary_preferences : [],
    email: user.email,
    first_name: completeProfileData?.first_name || '',
    last_name: completeProfileData?.last_name || '',
    birth_date: completeProfileData?.birth_date || null,
    residence_location: completeProfileData?.residence_location || ''
  };
  
  // Create a zapRoadData object for insertion
  const zapRoadData = {
    id: tripId, // Use the same UUID for both id and trip_id
    user_id: user.id,
    trip_id: tripId,
    title: formData.title || "",
    description: formData.description || "",
    location: formData.startingCity || formData.location || "",
    coordinates: formData.startingCityCoordinates ? JSON.stringify(formData.startingCityCoordinates) : null,
    profile_data: formattedProfileData,
    trip_type: 'ZapRoad',
    // ZapRoad specific fields
    starting_city: formData.startingCity || "",
    starting_city_coordinates: formData.startingCityCoordinates ? JSON.stringify(formData.startingCityCoordinates) : null,
    // Format stopover cities with stringified coordinates but keep the array as is
    stopover_cities: stopoverCitiesData.length > 0 ? JSON.stringify(stopoverCitiesData.map(city => ({
      name: city.name,
      coordinates: JSON.stringify(city.coordinates)
    }))) : '[]',
    end_city: formData.endCity || "",
    end_city_coordinates: formData.endCityCoordinates ? JSON.stringify(formData.endCityCoordinates) : null,
    number_of_people: formData.numberOfPeople || 1,
    adults: formData.adults || 1,
    kids: formData.kids || 0,
    has_electric_car: formData.hasElectricCar === true || formData['has_electric_car'] === true,
    car_type: formData.carType || formData['car_type'] || '',
    interests: Array.isArray(formData.interests) ? formData.interests : [],
    has_pets: formData.hasPets === true || formData['has_pets'] === true,
    // Add notes field
    notes: formData.notes || '',
    // Convert Date objects to ISO strings for database compatibility
    start_date: formData.startDate ? formData.startDate.toISOString() : null,
    end_date: formData.endDate ? formData.endDate.toISOString() : null,
    special_requirements: formData.specialRequirements || "",
    // Add budget and currency
    budget: formData.budget ? parseFloat(formData.budget) : 0,
    currency: formData.currency || 'CAD',
    category: formData.category || '',
  };

  console.log("Final ZapRoad data for insertion:", JSON.stringify(zapRoadData, null, 2));
  
  try {
    const { data: zapRoadResult, error: zapRoadError } = await supabase
      .from('zaproad_data')
      .insert(zapRoadData)
      .select();
      
    if (zapRoadError) {
      console.error("Error creating ZapRoad trip:", zapRoadError);
      throw zapRoadError;
    }

    console.log("ZapRoad trip created successfully:", zapRoadResult);

    // Add a small delay to ensure Supabase has processed the insertion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send data to Make webhook for ZapRoad trips
    if (zapRoadResult && zapRoadResult.length > 0) {
      const webhookPayload = prepareZapRoadWebhookPayload({
        ...zapRoadResult[0],
        email: user.email, // Add email here for webhook but it won't be stored in DB
        trip_type: 'zaproad' // Ensure trip type is explicitly set
      });
      const webhookResult = await sendTripToWebhook(webhookPayload);
    }

    return zapRoadResult;
  } catch (error) {
    console.error("Exception in createZapRoadTrip:", error);
    throw error;
  }
}
