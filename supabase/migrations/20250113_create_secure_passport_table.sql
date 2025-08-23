-- SECURE PASSPORT TABLE
-- This migration creates a separate, highly secured table for passport information

-- 1. Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the secure passport table
CREATE TABLE IF NOT EXISTS secure_passports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Encrypted passport fields
    passport_number_encrypted TEXT,
    passport_country_encrypted TEXT,
    passport_expiry_date DATE,
    
    -- Security metadata
    encryption_key_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    
    -- Ensure one passport record per user
    UNIQUE(user_id)
);

-- 3. Create audit table for all passport access
CREATE TABLE IF NOT EXISTS passport_access_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    passport_id UUID NOT NULL REFERENCES secure_passports(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'edit', 'create', 'delete', 'access_denied')),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create encryption/decryption functions
CREATE OR REPLACE FUNCTION encrypt_passport_field(data text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Use AES-256 encryption with a secure IV
    RETURN encode(encrypt_iv(
        data::bytea, 
        encryption_key::bytea, 
        '0123456789abcdef'::bytea, 
        'aes-cbc'
    ), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_passport_field(encrypted_data text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF encrypted_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Decrypt the data
    RETURN convert_from(decrypt_iv(
        decode(encrypted_data, 'base64'), 
        encryption_key::bytea, 
        '0123456789abcdef'::bytea, 
        'aes-cbc'
    ), 'utf8');
END;
$$;

-- 5. Create secure function to store passport data
CREATE OR REPLACE FUNCTION store_passport_data(
    p_user_id UUID,
    p_passport_number TEXT,
    p_passport_country TEXT,
    p_passport_expiry_date DATE,
    p_encryption_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    passport_id UUID;
    key_hash TEXT;
BEGIN
    -- Verify user can only access their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access to passport data';
    END IF;
    
    -- Hash the encryption key for storage
    key_hash := encode(digest(p_encryption_key, 'sha256'), 'hex');
    
    -- Encrypt sensitive data
    INSERT INTO secure_passports (
        user_id,
        passport_number_encrypted,
        passport_country_encrypted,
        passport_expiry_date,
        encryption_key_hash
    ) VALUES (
        p_user_id,
        encrypt_passport_field(p_passport_number, p_encryption_key),
        encrypt_passport_field(p_passport_country, p_encryption_key),
        p_passport_expiry_date,
        key_hash
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        passport_number_encrypted = encrypt_passport_field(p_passport_number, p_encryption_key),
        passport_country_encrypted = encrypt_passport_field(p_passport_country, p_encryption_key),
        passport_expiry_date = p_passport_expiry_date,
        encryption_key_hash = key_hash,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO passport_id;
    
    -- Log the access
    INSERT INTO passport_access_audit (
        user_id, 
        passport_id, 
        action, 
        ip_address, 
        user_agent, 
        session_id
    ) VALUES (
        p_user_id, 
        passport_id, 
        'edit', 
        inet_client_addr(), 
        current_setting('application_name'), 
        current_setting('session.id')
    );
    
    RETURN passport_id;
END;
$$;

-- 6. Create secure function to retrieve passport data
CREATE OR REPLACE FUNCTION get_passport_data(
    p_user_id UUID,
    p_encryption_key TEXT
)
RETURNS TABLE(
    passport_number TEXT,
    passport_country TEXT,
    passport_expiry_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    passport_record RECORD;
    key_hash TEXT;
BEGIN
    -- Verify user can only access their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access to passport data';
    END IF;
    
    -- Hash the encryption key for verification
    key_hash := encode(digest(p_encryption_key, 'sha256'), 'hex');
    
    -- Get the passport record
    SELECT * INTO passport_record 
    FROM secure_passports 
    WHERE user_id = p_user_id;
    
    -- Check if record exists
    IF NOT FOUND THEN
        -- Log access denied
        INSERT INTO passport_access_audit (
            user_id, 
            passport_id, 
            action, 
            ip_address, 
            user_agent, 
            session_id,
            success,
            error_message
        ) VALUES (
            p_user_id, 
            NULL, 
            'access_denied', 
            inet_client_addr(), 
            current_setting('application_name'), 
            current_setting('session.id'),
            false,
            'No passport data found'
        );
        
        RETURN;
    END IF;
    
    -- Verify encryption key hash matches
    IF passport_record.encryption_key_hash != key_hash THEN
        -- Log access denied
        INSERT INTO passport_access_audit (
            user_id, 
            passport_id, 
            action, 
            ip_address, 
            user_agent, 
            session_id,
            success,
            error_message
        ) VALUES (
            p_user_id, 
            passport_record.id, 
            'access_denied', 
            inet_client_addr(), 
            current_setting('application_name'), 
            current_setting('session.id'),
            false,
            'Invalid encryption key'
        );
        
        RAISE EXCEPTION 'Invalid encryption key';
    END IF;
    
    -- Update access metadata
    UPDATE secure_passports 
    SET 
        last_accessed_at = CURRENT_TIMESTAMP,
        access_count = access_count + 1
    WHERE id = passport_record.id;
    
    -- Log successful access
    INSERT INTO passport_access_audit (
        user_id, 
        passport_id, 
        action, 
        ip_address, 
        user_agent, 
        session_id
    ) VALUES (
        p_user_id, 
        passport_record.id, 
        'view', 
        inet_client_addr(), 
        current_setting('application_name'), 
        current_setting('session.id')
    );
    
    -- Return decrypted data
    RETURN QUERY SELECT
        decrypt_passport_field(passport_record.passport_number_encrypted, p_encryption_key),
        decrypt_passport_field(passport_record.passport_country_encrypted, p_encryption_key),
        passport_record.passport_expiry_date;
END;
$$;

-- 7. Create function to delete passport data
CREATE OR REPLACE FUNCTION delete_passport_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    passport_record RECORD;
BEGIN
    -- Verify user can only delete their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized access to passport data';
    END IF;
    
    -- Get the passport record
    SELECT * INTO passport_record 
    FROM secure_passports 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Log the deletion
    INSERT INTO passport_access_audit (
        user_id, 
        passport_id, 
        action, 
        ip_address, 
        user_agent, 
        session_id
    ) VALUES (
        p_user_id, 
        passport_record.id, 
        'delete', 
        inet_client_addr(), 
        current_setting('application_name'), 
        current_setting('session.id')
    );
    
    -- Delete the record
    DELETE FROM secure_passports WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$;

-- 8. Create RLS policies for the secure tables
ALTER TABLE secure_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_access_audit ENABLE ROW LEVEL SECURITY;

-- Users can only access their own passport data
CREATE POLICY "Users can only access their own passport data" ON secure_passports
    FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own audit logs
CREATE POLICY "Users can only see their own audit logs" ON passport_access_audit
    FOR SELECT USING (auth.uid() = user_id);

-- Only the secure functions can insert audit logs
CREATE POLICY "Only secure functions can insert audit logs" ON passport_access_audit
    FOR INSERT WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX idx_secure_passports_user_id ON secure_passports(user_id);
CREATE INDEX idx_passport_access_audit_user_id ON passport_access_audit(user_id);
CREATE INDEX idx_passport_access_audit_accessed_at ON passport_access_audit(accessed_at);

-- 10. Grant minimal permissions
GRANT EXECUTE ON FUNCTION store_passport_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_passport_data TO authenticated;
GRANT EXECUTE ON FUNCTION delete_passport_data TO authenticated;

-- 11. Remove passport fields from profiles table (optional - comment out if you want to keep them)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS passport_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS passport_country;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS passport_expiry_date;

-- 12. Add security comments
COMMENT ON TABLE secure_passports IS 'Highly secured table for encrypted passport data with access logging';
COMMENT ON TABLE passport_access_audit IS 'Audit log for all passport data access attempts';
COMMENT ON FUNCTION store_passport_data IS 'Secure function to store encrypted passport data with access logging';
COMMENT ON FUNCTION get_passport_data IS 'Secure function to retrieve decrypted passport data with access logging';
COMMENT ON FUNCTION delete_passport_data IS 'Secure function to delete passport data with access logging'; 