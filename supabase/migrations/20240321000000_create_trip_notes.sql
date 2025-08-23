-- Create trip_notes table
CREATE TABLE IF NOT EXISTS trip_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL,
    trip_type TEXT NOT NULL CHECK (trip_type IN ('zaptrip', 'zapout', 'zaproad')),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_notes_trip_id ON trip_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_trip_type ON trip_notes(trip_type);
CREATE INDEX IF NOT EXISTS idx_trip_notes_user_id ON trip_notes(user_id);

-- Add RLS policies
ALTER TABLE trip_notes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view notes
CREATE POLICY "Authenticated users can view notes"
    ON trip_notes
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert notes
CREATE POLICY "Authenticated users can insert notes"
    ON trip_notes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update notes
CREATE POLICY "Authenticated users can update notes"
    ON trip_notes
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete notes
CREATE POLICY "Authenticated users can delete notes"
    ON trip_notes
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trip_notes_updated_at
    BEFORE UPDATE ON trip_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 