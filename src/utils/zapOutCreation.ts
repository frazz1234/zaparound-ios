/**
 * Utility functions for creating ZapOut trips
 */
import { supabase } from "@/integrations/supabase/client";
import { sendTripToWebhook, prepareZapOutWebhookPayload } from "./webhook";
import { TripFormData } from "@/types/trip";

/**
 * Create a ZapOut trip in the database
 */
export async function createZapOutTrip(
  formData: TripFormData, 
  user: any, 
  profileData: any
) {
  // For ZapOut trips, generate a UUID to use as trip_id
  const tripId = crypto.randomUUID();
  
  console.log("createZapOutTrip - Starting with raw form data:", JSON.stringify(formData, null, 2));
  console.log("createZapOutTrip - User data:", JSON.stringify(user, null, 2));
  console.log("createZapOutTrip - Profile data:", JSON.stringify(profileData, null, 2));
  
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
  
  // Ensure all arrays are defined and properly formatted
  const activityTimes = Array.isArray(formData.activityTimes) ? formData.activityTimes : [];
  const activityTypes = Array.isArray(formData.activityTypes) ? formData.activityTypes : [];
  const requestedActivities = Array.isArray(formData.requestedActivities) ? formData.requestedActivities : [];
  
  // Ensure booleans are properly defined
  const includeLunch = formData.includeLunch === true;
  const includeBudgetPerPerson = formData.includeBudgetPerPerson === true;
  
  // Format the date as ISO string if it exists
  const date = formData.startDate 
    ? new Date(formData.startDate).toISOString() 
    : null;
  
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
  
  console.log("createZapOutTrip - Processed form data:", { 
    includeLunch, 
    includeBudgetPerPerson,
    activityTimes,
    activityTypes,
    requestedActivities,
    lunchOption: formData.lunchOption,
    budgetPerPerson: formData.budgetPerPerson,
    additionalNeeds: formData.additionalNeeds,
    date,
    formattedProfileData
  });
  
  // Create a base zapOutData object with all fields explicitly defined
  const zapOutData = {
    id: tripId,
    user_id: user.id,
    trip_id: tripId,
    title: formData.title || "",
    description: formData.description || "",
    location: formData.location || "",
    coordinates: formData.coordinates ? JSON.stringify(formData.coordinates) : null,
    adults: formData.adults || 1,
    kids: formData.kids || 0,
    profile_data: formattedProfileData,
    trip_type: 'ZapOut',
    // ZapOut specific fields with explicit values
    activity_times: activityTimes,
    activity_types: activityTypes,
    requested_activities: requestedActivities,
    additional_needs: formData.additionalNeeds || null,
    date: date,
    min_budget: formData.minBudget || "0",
    max_budget: formData.maxBudget || "500",
    currency: formData.currency || "USD",
    // Add optional fields only if they exist
    ...(includeBudgetPerPerson && { budget_per_person: formData.budgetPerPerson || '' }),
    // Add category if it exists
    ...(formData.category && { category: formData.category }),
    // Add budget if it exists
    ...(formData.budget && { budget: formData.budget }),
    // Add transportation details if they exist
    ...(formData.transportationMode && { transportation_mode: formData.transportationMode }),
    ...(formData.transportationDetails && { transportation_details: formData.transportationDetails }),
    // Add accommodation details if they exist
    ...(formData.accommodationType && { accommodation_type: formData.accommodationType }),
    ...(formData.accommodationDetails && { accommodation_details: formData.accommodationDetails })
  };

  console.log("createZapOutTrip - Final data for Supabase insertion:", JSON.stringify(zapOutData, null, 2));
  
  try {
    console.log("createZapOutTrip - Attempting to insert data into Supabase...");
    const { data: zapOutResult, error: zapOutError } = await supabase
      .from('zapout_data')
      .insert(zapOutData)
      .select();
      
    if (zapOutError) {
      console.error("createZapOutTrip - Supabase insertion error:", zapOutError);
      throw zapOutError;
    }

    console.log("createZapOutTrip - Supabase insertion successful:", JSON.stringify(zapOutResult, null, 2));

    // Add a small delay to ensure Supabase has processed the insertion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send data to Make webhook for ZapOut trips
    if (zapOutResult && zapOutResult.length > 0) {
      const webhookPayload = prepareZapOutWebhookPayload({
        ...zapOutResult[0],
        email: user.email, // Add email here for webhook but it won't be stored in DB
        trip_type: 'zapout' // Ensure trip type is explicitly set
      });
      const webhookResult = await sendTripToWebhook(webhookPayload);
     
    }

    return zapOutResult;
  } catch (error) {
    console.error("createZapOutTrip - Exception:", error);
    throw error;
  }
}
