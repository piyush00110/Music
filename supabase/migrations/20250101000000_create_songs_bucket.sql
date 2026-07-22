-- Create songs storage bucket for downloaded music
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'songs',
  'songs',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to songs bucket
CREATE POLICY "Songs public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'songs');

-- Allow authenticated users to upload songs
CREATE POLICY "Songs insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'songs');

-- Allow authenticated users to update their songs
CREATE POLICY "Songs update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'songs');

-- Allow authenticated users to delete their songs
CREATE POLICY "Songs delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'songs');
