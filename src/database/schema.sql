-- Table for Community Posts
CREATE TABLE community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table for Post Likes
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
    UNIQUE (post_id, user_id)
);

-- Table for Post Comments
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table for Nearby Activities
CREATE TABLE nearby_activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table for Popular Destinations
CREATE TABLE popular_destinations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_destinations ENABLE ROW LEVEL SECURITY;

-- Policy for community_posts
CREATE POLICY "Allow all users to insert posts" ON community_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own posts" ON community_posts
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own posts" ON community_posts
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow admins to delete any post" ON community_posts
    FOR DELETE
    TO authenticated
    USING (auth.role() = 'admin');

-- Policy for post_likes
CREATE POLICY "Allow all users to insert likes" ON post_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to delete their own likes" ON post_likes
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Policy for post_comments
CREATE POLICY "Allow all users to insert comments" ON post_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own comments" ON post_comments
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own comments" ON post_comments
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Policy for nearby_activities
CREATE POLICY "Allow all users to insert activities" ON nearby_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own activities" ON nearby_activities
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own activities" ON nearby_activities
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Policy for popular_destinations
CREATE POLICY "Allow all users to insert destinations" ON popular_destinations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own destinations" ON popular_destinations
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own destinations" ON popular_destinations
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for community_posts
CREATE POLICY "Enable read access for all users" ON community_posts
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON community_posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON community_posts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON community_posts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
CREATE POLICY "Enable read access for all users" ON post_likes
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON post_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON post_likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for post_comments
CREATE POLICY "Enable read access for all users" ON post_comments
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON post_comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON post_comments
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON post_comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for nearby_activities
ALTER TABLE nearby_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for nearby_activities
CREATE POLICY "Enable read access for all users" ON nearby_activities
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON nearby_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON nearby_activities
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON nearby_activities
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for popular_destinations
ALTER TABLE popular_destinations ENABLE ROW LEVEL SECURITY;

-- Create policies for popular_destinations
CREATE POLICY "Enable read access for all users" ON popular_destinations
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON popular_destinations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON popular_destinations
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON popular_destinations
    FOR DELETE
    USING (auth.uid() = user_id); 