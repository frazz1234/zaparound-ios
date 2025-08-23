import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface POI {
  id: string;
  name: string;
  url?: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  categories: string[];
  poi_category_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category_name?: string;
  category_image_url?: string;
  average_rating?: number;
  review_count?: number;
  rating_type?: 'out_of_10' | 'out_of_5' | 'percentage';
}

export interface POIReview {
  id: string;
  poi_id: string;
  user_id: string;
  rating: number;
  rating_type: 'out_of_10' | 'out_of_5' | 'percentage';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePOIs = () => {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPOIs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch POIs with category information and average ratings
      const { data, error: fetchError } = await supabase
        .from('pois')
        .select(`
          *,
          poi_categories!poi_category_id (
            name,
            image_url
          ),
          poi_reviews (
            rating,
            rating_type
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Process the data to calculate average ratings and format categories
      const processedPOIs: POI[] = (data || []).map((poi: any) => {
        console.log('Processing POI:', poi.name, 'Category:', poi.poi_categories, 'Image URL:', poi.poi_categories?.image_url);
        
        // Calculate average rating and determine rating type
        let averageRating = 0;
        let reviewCount = 0;
        let ratingType: 'out_of_10' | 'out_of_5' | 'percentage' | undefined;
        
        if (poi.poi_reviews && poi.poi_reviews.length > 0) {
          // Count rating types to determine the most common one
          const ratingTypeCounts = {
            out_of_10: 0,
            out_of_5: 0,
            percentage: 0
          };
          
          poi.poi_reviews.forEach((review: any) => {
            ratingTypeCounts[review.rating_type]++;
          });
          
          // Determine the most common rating type
          const maxCount = Math.max(ratingTypeCounts.out_of_10, ratingTypeCounts.out_of_5, ratingTypeCounts.percentage);
          if (ratingTypeCounts.out_of_10 === maxCount) {
            ratingType = 'out_of_10';
          } else if (ratingTypeCounts.out_of_5 === maxCount) {
            ratingType = 'out_of_5';
          } else {
            ratingType = 'percentage';
          }
          
          // Calculate average in the most common rating type
          const reviewsInMainType = poi.poi_reviews.filter((review: any) => review.rating_type === ratingType);
          if (reviewsInMainType.length > 0) {
            const totalRating = reviewsInMainType.reduce((sum: number, review: any) => sum + review.rating, 0);
            averageRating = totalRating / reviewsInMainType.length;
          }
          
          reviewCount = poi.poi_reviews.length;
        }

        return {
          id: poi.id,
          name: poi.name,
          url: poi.url,
          description: poi.description,
          address: poi.address,
          lat: poi.lat,
          lng: poi.lng,
          categories: poi.categories || [],
          poi_category_id: poi.poi_category_id,
          created_at: poi.created_at,
          updated_at: poi.updated_at,
          category_name: poi.poi_categories?.name,
          category_image_url: poi.poi_categories?.image_url,
          average_rating: averageRating,
          review_count: reviewCount,
          rating_type: ratingType,
        };
      });

      setPOIs(processedPOIs);
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch POIs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPOIReviews = async (poiId: string): Promise<POIReview[]> => {
    try {
      const { data, error } = await supabase
        .from('poi_reviews')
        .select('*')
        .eq('poi_id', poiId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching POI reviews:', err);
      return [];
    }
  };

  const addPOIReview = async (poiId: string, rating: number, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('poi_reviews')
        .upsert({
          poi_id: poiId,
          user_id: user.id,
          rating,
          rating_type: 'out_of_10',
          notes,
        });

      if (error) throw error;

      // Refresh POIs to update average rating
      await fetchPOIs();
      
      return true;
    } catch (err) {
      console.error('Error adding POI review:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPOIs();
  }, []);

  return {
    pois,
    loading,
    error,
    fetchPOIs,
    fetchPOIReviews,
    addPOIReview,
  };
}; 