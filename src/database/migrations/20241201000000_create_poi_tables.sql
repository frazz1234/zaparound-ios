-- Create POI Category table
CREATE TABLE IF NOT EXISTS public.poi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create POI table
CREATE TABLE IF NOT EXISTS public.pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT,
    description TEXT,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    categories TEXT[] DEFAULT '{}',
    poi_category_id UUID REFERENCES public.poi_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_poi_categories_name ON public.poi_categories(name);
CREATE INDEX IF NOT EXISTS idx_pois_poi_category_id ON public.pois(poi_category_id);
CREATE INDEX IF NOT EXISTS idx_pois_categories ON public.pois USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_pois_location ON public.pois(lat, lng);

-- Enable Row Level Security
ALTER TABLE public.poi_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;

-- Create policies for poi_categories table
-- Allow public read access
CREATE POLICY "Anyone can read POI categories"
    ON public.poi_categories
    FOR SELECT
    TO public
    USING (true);

-- Allow admin users to manage POI categories
CREATE POLICY "Admin users can manage POI categories"
    ON public.poi_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create policies for pois table
-- Allow public read access
CREATE POLICY "Anyone can read POIs"
    ON public.pois
    FOR SELECT
    TO public
    USING (true);

-- Allow admin users to manage POIs
CREATE POLICY "Admin users can manage POIs"
    ON public.pois
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_poi_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_poi_categories_updated_at
    BEFORE UPDATE ON public.poi_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_poi_updated_at_column();

CREATE TRIGGER update_pois_updated_at
    BEFORE UPDATE ON public.pois
    FOR EACH ROW
    EXECUTE FUNCTION update_poi_updated_at_column();

-- Add comments
COMMENT ON TABLE public.poi_categories IS 'Categories for Points of Interest (e.g., restaurants, hotels, attractions)';
COMMENT ON TABLE public.pois IS 'Points of Interest with location data and category associations';
COMMENT ON COLUMN public.pois.categories IS 'Array of category tags (e.g., restaurant, hotel, review)'; 