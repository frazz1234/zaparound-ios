export interface Profile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  medical_conditions: string[] | null;
  dietary_preferences: string[] | null;
  disabilities: string[] | null;
  allergies: string[] | null;
  lgbtq_status: string[] | null;
  birth_date: string | null;
  residence_location: string | null;
  language: string | null;
  newsletter_subscribed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  email: string | null;
} 