import { Database } from "@/integrations/supabase/types";

// Define role type based on the database enum
export type UserRole = Database["public"]["Enums"]["user_role"];

export interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  role: UserRole;
  post_count: number;
  zap_trip_count: number;
  zap_out_count: number;
  zap_road_count: number;
  created_at: string;
} 