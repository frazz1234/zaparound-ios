-- Create favorites table for users to save their favorite places
CREATE TABLE public.favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    place_name VARCHAR(255) NOT NULL,
    place_address TEXT,
    place_rating DECIMAL(3, 2),
    place_lat DECIMAL(10, 8),
    place_lng DECIMAL(11, 8),
    place_types TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, place_id)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.favorites IS 'User favorite places from Google Places API';
COMMENT ON COLUMN public.favorites.place_id IS 'Google Places place_id';
COMMENT ON COLUMN public.favorites.place_name IS 'Name of the place';
COMMENT ON COLUMN public.favorites.place_address IS 'Formatted address of the place';
COMMENT ON COLUMN public.favorites.place_rating IS 'Rating from Google Places';
COMMENT ON COLUMN public.favorites.place_lat IS 'Latitude of the place';
COMMENT ON COLUMN public.favorites.place_lng IS 'Longitude of the place';
COMMENT ON COLUMN public.favorites.place_types IS 'Array of place types from Google Places';

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites" ON public.favorites
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own favorites" ON public.favorites
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites" ON public.favorites
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_place_id ON public.favorites(place_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_favorites_updated_at
    BEFORE UPDATE ON public.favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_favorites_updated_at(); 