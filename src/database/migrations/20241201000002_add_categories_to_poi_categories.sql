-- Add categories column to poi_categories table
ALTER TABLE public.poi_categories 
ADD COLUMN categories TEXT[] DEFAULT '{}';

-- Create index for better performance on categories
CREATE INDEX IF NOT EXISTS idx_poi_categories_categories ON public.poi_categories USING GIN(categories);

-- Add comment
COMMENT ON COLUMN public.poi_categories.categories IS 'Array of category tags for the POI category (e.g., restaurant, hotel, attraction)'; 