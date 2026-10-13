-- ==============================================================================
-- Esan Foods: pgvector Semantic Product Search & Agent Conversation Schema
-- 1. Run this in your Supabase SQL editor:
--    https://supabase.com/dashboard/project/tacyfcsyswlwbdtminnz/sql/new
-- 2. Uses OpenAI text-embedding-3-small (1536 dimensions) via OpenRouter
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Conversations Table (stores customer chat sessions)
CREATE TABLE IF NOT EXISTS public.esan_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  channel TEXT DEFAULT 'web_storefront',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Messages Table (stores chat messages, interim steps, tool executions, recommendations, and navigation)
CREATE TABLE IF NOT EXISTS public.esan_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.esan_conversations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  system_status TEXT,                             -- Current systemic interim message (e.g. "Checking inventory for Moringa Powder...")
  interim_steps JSONB DEFAULT '[]'::jsonb,        -- Step-by-step interim execution history (what it searched, how many results found)
  tools_used JSONB DEFAULT '[]'::jsonb,           -- Array of tools executed in this turn
  recommended_products JSONB DEFAULT '[]'::jsonb, -- Array of product cards with stock & image
  navigation JSONB,                               -- Navigation action (e.g. { productId: "guava-juice", action: "navigate_product" })
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),                         -- OpenAI embedding of the message
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure interim_steps column exists if table was previously created
ALTER TABLE public.esan_messages ADD COLUMN IF NOT EXISTS interim_steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.esan_messages ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 4. Vector Embedding column on Products Table
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 5. Product Embeddings Table (for multi-chunk semantic search: benefits, ingredients, nutrition, health goals)
CREATE TABLE IF NOT EXISTS public.product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. High-Performance HNSW Vector Indexes (Cosine Similarity)
CREATE INDEX IF NOT EXISTS idx_products_embedding 
  ON public.products USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_embedding 
  ON public.product_embeddings USING hnsw (embedding vector_cosine_ops);

-- Standard relational indexes
CREATE INDEX IF NOT EXISTS idx_esan_messages_session ON public.esan_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_esan_messages_convo ON public.esan_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_esan_messages_created ON public.esan_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_esan_conversations_session ON public.esan_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product ON public.product_embeddings(product_id);

-- 7. PostgREST RPC: Semantic Match Products Function
-- Called via: supabase.rpc('match_products', { query_embedding: [...], match_threshold: 0.25, match_count: 5, filter_category: '' })
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 6,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  name text,
  subtitle text,
  category text,
  price numeric,
  stock_quantity int,
  stock_status text,
  image text,
  description text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id::text,
    p.name::text,
    p.subtitle::text,
    p.category::text,
    p.price::numeric,
    p.stock_quantity::int,
    p.stock_status::text,
    p.image::text,
    p.description::text,
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
    AND (filter_category IS NULL OR filter_category = '' OR p.category ILIKE '%' || filter_category || '%')
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 8. PostgREST RPC: Semantic Match Product Chunks / Benefits Function
-- Called via: supabase.rpc('match_product_embeddings', { query_embedding: [...], match_threshold: 0.20, match_count: 6 })
CREATE OR REPLACE FUNCTION match_product_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  product_id text,
  title text,
  content text,
  category text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.product_id,
    pe.title,
    pe.content,
    pe.category,
    (1 - (pe.embedding <=> query_embedding))::float AS similarity,
    pe.metadata
  FROM public.product_embeddings pe
  WHERE pe.embedding IS NOT NULL
    AND (1 - (pe.embedding <=> query_embedding)) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE public.esan_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esan_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Conversations policies
  DROP POLICY IF EXISTS "Public full access to esan_conversations" ON public.esan_conversations;
  CREATE POLICY "Public full access to esan_conversations" ON public.esan_conversations
    FOR ALL USING (true) WITH CHECK (true);

  -- Messages policies
  DROP POLICY IF EXISTS "Public full access to esan_messages" ON public.esan_messages;
  CREATE POLICY "Public full access to esan_messages" ON public.esan_messages
    FOR ALL USING (true) WITH CHECK (true);

  -- Product Embeddings policies
  DROP POLICY IF EXISTS "Public read access to product_embeddings" ON public.product_embeddings;
  CREATE POLICY "Public read access to product_embeddings" ON public.product_embeddings
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Public insert access to product_embeddings" ON public.product_embeddings;
  CREATE POLICY "Public insert access to product_embeddings" ON public.product_embeddings
    FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Public update access to product_embeddings" ON public.product_embeddings;
  CREATE POLICY "Public update access to product_embeddings" ON public.product_embeddings
    FOR UPDATE USING (true);
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
