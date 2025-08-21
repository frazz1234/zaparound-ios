-- Create bookings table for storing all booking information
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_reference VARCHAR(255) UNIQUE NOT NULL,
    booking_type VARCHAR(50) NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'flight_hotel', 'trip')),
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    
    -- Duffel booking information
    duffel_order_id VARCHAR(255),
    duffel_booking_reference VARCHAR(255),
    
    -- Trip information
    trip_name VARCHAR(255),
    trip_description TEXT,
    
    -- Flight information
    flight_data JSONB, -- Stores complete flight offer and booking data
    
    -- Hotel information
    hotel_data JSONB, -- Stores hotel booking data
    
    -- Passenger information
    passengers JSONB NOT NULL, -- Array of passenger objects with all details
    
    -- Financial information
    base_amount DECIMAL(10,2) NOT NULL,
    luggage_fees DECIMAL(10,2) DEFAULT 0,
    ancillaries_fees DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'paid',
    
    -- Dates
    departure_date DATE,
    return_date DATE,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    notes TEXT,
    special_requests TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_booking_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_duffel_order_id ON bookings(duffel_order_id);
CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_departure_date ON bookings(departure_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookings" ON bookings
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'admin');

CREATE POLICY "Admins can update all bookings" ON bookings
    FOR UPDATE
    TO authenticated
    USING (auth.role() = 'admin');

CREATE POLICY "Admins can delete all bookings" ON bookings
    FOR DELETE
    TO authenticated
    USING (auth.role() = 'admin');

-- Create a function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR(255) AS $$
DECLARE
    reference VARCHAR(255);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a reference with format: ZAP-YYYYMMDD-XXXXX
        reference := 'ZAP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                    lpad(floor(random() * 100000)::text, 5, '0');
        
        -- Check if reference already exists
        IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = reference) THEN
            RETURN reference;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique booking reference after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 