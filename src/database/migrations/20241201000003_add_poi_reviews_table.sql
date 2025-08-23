-- Create POI reviews table
CREATE TABLE public.poi_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10) NOT NULL,
    rating_type VARCHAR(20) DEFAULT 'out_of_10' CHECK (rating_type IN ('out_of_10', 'out_of_5', 'percentage')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poi_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_poi_reviews_poi_id ON public.poi_reviews(poi_id);
CREATE INDEX IF NOT EXISTS idx_poi_reviews_user_id ON public.poi_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_poi_reviews_rating ON public.poi_reviews(rating);

-- Enable RLS
ALTER TABLE public.poi_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all reviews
CREATE POLICY "Users can view all POI reviews" ON public.poi_reviews
    FOR SELECT USING (true);

-- Users can create reviews for themselves
CREATE POLICY "Users can create POI reviews" ON public.poi_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own POI reviews" ON public.poi_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own POI reviews" ON public.poi_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all POI reviews" ON public.poi_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_poi_reviews_updated_at 
    BEFORE UPDATE ON public.poi_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.poi_reviews IS 'User reviews and ratings for POIs';
COMMENT ON COLUMN public.poi_reviews.rating IS 'Rating value (0-10 scale)';
COMMENT ON COLUMN public.poi_reviews.rating_type IS 'Type of rating scale (out_of_10, out_of_5, percentage)';
COMMENT ON COLUMN public.poi_reviews.notes IS 'User review notes and comments'; 