export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export interface CommunityPost {
  id: number;
  user_id: string;
  title: string;
  content: string;
  media_urls?: MediaItem[];
  image_url?: string; // Legacy field for backward compatibility
  location?: string;
  place_id?: string;
  place_lat?: number;
  place_lng?: number;
  place_types?: string[];
  place_rating?: number;
  place_user_ratings_total?: number;
  post_type?: 'activity' | 'destination';
  rating?: number;
  category?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  profile?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  likes?: Array<{ count: number }>;
  replies?: Array<{ count: number }>;
}

export interface PostReply {
  id: string;
  post_id: number;
  user_id: string;
  content: string;
  media_urls?: MediaItem[];
  image_url?: string; // Legacy field for backward compatibility
  rating?: number;
  created_at: string;
  updated_at: string;
  profile?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
} 