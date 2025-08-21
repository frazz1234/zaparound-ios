-- Create newsletter_unsubscribes table for tracking unsubscribe reasons and feedback
CREATE TABLE IF NOT EXISTS public.newsletter_unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  reason TEXT,
  feedback TEXT,
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to newsletter_unsubscribes" ON public.newsletter_unsubscribes
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribes_email ON public.newsletter_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribes_created_at ON public.newsletter_unsubscribes(created_at);

-- Add comment for documentation
COMMENT ON TABLE public.newsletter_unsubscribes IS 'Tracks newsletter unsubscribe reasons and feedback for improving user experience';
