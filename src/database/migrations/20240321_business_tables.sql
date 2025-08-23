-- Create enum for business status
CREATE TYPE business_status AS ENUM ('active', 'inactive', 'pending');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Direct query that bypasses RLS completely
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    website VARCHAR(255),
    status business_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(owner_id)
);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses table
CREATE POLICY "Business owners can manage their own business"
    ON businesses
    FOR ALL
    TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all businesses"
    ON businesses
    FOR ALL
    TO authenticated
    USING (is_admin());

-- Create business_members table for team members
CREATE TABLE business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, email),
    UNIQUE(business_id, user_id)
);

-- Enable Row Level Security for business_members
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Create policies for business_members table
CREATE POLICY "Business owners can manage their team members"
    ON business_members
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = business_members.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all team members"
    ON business_members
    FOR ALL
    TO authenticated
    USING (is_admin());

-- Create business_clients table
CREATE TABLE business_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Profile fields
    medical_conditions TEXT[],
    dietary_preferences TEXT[],
    disabilities TEXT[],
    allergies TEXT[],
    lgbtq_status TEXT[],
    birth_date DATE,
    language VARCHAR(10),
    newsletter_subscribed BOOLEAN DEFAULT false
);

-- Enable Row Level Security for business_clients
ALTER TABLE business_clients ENABLE ROW LEVEL SECURITY;

-- Create policies for business_clients table
CREATE POLICY "Business owners can manage their clients"
    ON business_clients
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = business_clients.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all clients"
    ON business_clients
    FOR ALL
    TO authenticated
    USING (is_admin());

-- Create business_activity table
CREATE TABLE business_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security for business_activity
ALTER TABLE business_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for business_activity table
CREATE POLICY "Business owners can view their activity"
    ON business_activity
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = business_activity.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all activity"
    ON business_activity
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Create business_settings table
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    theme_color VARCHAR(7) DEFAULT '#000000',
    logo_url VARCHAR(255),
    brand_name VARCHAR(255),
    brand_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id)
);

-- Enable Row Level Security
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_settings
CREATE POLICY "Business owners can manage their settings"
    ON business_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = business_settings.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all settings"
    ON business_settings FOR ALL
    TO authenticated
    USING (is_admin());

-- Create helper functions
CREATE OR REPLACE FUNCTION is_business_owner(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = business_id
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_business_member(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_members
        WHERE business_id = business_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 