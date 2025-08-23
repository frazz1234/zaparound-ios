-- Create trip_checklist_items table for main items
CREATE TABLE IF NOT EXISTS trip_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL,
    trip_type TEXT NOT NULL CHECK (trip_type IN ('zaptrip', 'zapout', 'zaproad')),
    title TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT valid_trip_reference CHECK (
        (trip_type = 'zaptrip' AND EXISTS (SELECT 1 FROM trips WHERE id = trip_id)) OR
        (trip_type = 'zapout' AND EXISTS (SELECT 1 FROM zapout_data WHERE id = trip_id)) OR
        (trip_type = 'zaproad' AND EXISTS (SELECT 1 FROM zaproad_data WHERE id = trip_id))
    )
);

-- Create trip_checklist_subitems table for sub-items
CREATE TABLE IF NOT EXISTS trip_checklist_subitems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES trip_checklist_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_trip_id ON trip_checklist_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_trip_type ON trip_checklist_items(trip_type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id ON trip_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_subitems_parent_id ON trip_checklist_subitems(parent_id);
CREATE INDEX IF NOT EXISTS idx_checklist_subitems_user_id ON trip_checklist_subitems(user_id);

-- Add RLS policies
ALTER TABLE trip_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_checklist_subitems ENABLE ROW LEVEL SECURITY;

-- Policies for main items
CREATE POLICY "Authenticated users can view checklist items"
    ON trip_checklist_items
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert checklist items"
    ON trip_checklist_items
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update checklist items"
    ON trip_checklist_items
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete checklist items"
    ON trip_checklist_items
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies for sub-items
CREATE POLICY "Authenticated users can view checklist subitems"
    ON trip_checklist_subitems
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert checklist subitems"
    ON trip_checklist_subitems
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update checklist subitems"
    ON trip_checklist_subitems
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete checklist subitems"
    ON trip_checklist_subitems
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON trip_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_subitems_updated_at
    BEFORE UPDATE ON trip_checklist_subitems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 