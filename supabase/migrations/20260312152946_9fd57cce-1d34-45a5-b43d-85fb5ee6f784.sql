
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create template_embeddings table for vector storage
CREATE TABLE public.template_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  embedding extensions.vector(768),
  visual_summary text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (public read, admin write via service role)
ALTER TABLE public.template_embeddings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read template embeddings
CREATE POLICY "Authenticated users can read template embeddings"
  ON public.template_embeddings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create the similarity search function
CREATE OR REPLACE FUNCTION public.match_templates(
  query_embedding extensions.vector(768),
  match_limit int DEFAULT 5,
  similarity_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  template_name text,
  visual_summary text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.template_name,
    te.visual_summary,
    1 - (te.embedding <=> query_embedding) AS similarity,
    te.metadata
  FROM public.template_embeddings te
  WHERE te.embedding IS NOT NULL
    AND 1 - (te.embedding <=> query_embedding) > similarity_threshold
  ORDER BY te.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;
