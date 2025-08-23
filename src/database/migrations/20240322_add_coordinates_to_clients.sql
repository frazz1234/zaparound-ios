-- Add coordinates column to business_clients table
ALTER TABLE business_clients
ADD COLUMN coordinates POINT;

-- Add index for coordinates
CREATE INDEX idx_business_clients_coordinates ON business_clients USING GIST (coordinates); 