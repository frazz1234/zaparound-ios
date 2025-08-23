// Blog-related type definitions
export type Blog = {
  id: string;
  title_en: string;
  title_fr: string;
  title_es: string;
  content_en: string;
  content_fr: string;
  content_es: string;
  excerpt_en: string | null;
  excerpt_fr: string | null;
  excerpt_es: string | null;
  image_url: string | null;
  author_id: string;
  category: string | null;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  parent_id: string | null;
  slug: string;
  is_published: boolean;
  notFound?: boolean; // Optional property to indicate if the blog was not found

  location?: string; // Location for location-specific content
  activities?: string[]; // Array of activities for activity-specific content
  stock_tickers?: string[]; // Array of stock tickers for financial content
};
