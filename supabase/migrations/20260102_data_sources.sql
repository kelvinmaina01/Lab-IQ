-- ============================================================================
-- LabIQ Health - Data Sources Infrastructure
-- This migration adds the persistence layer for external data connections
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_source_type') THEN
        CREATE TYPE data_source_type AS ENUM (
            'database',
            'warehouse',
            'clinical',
            'wearable',
            'cloud',
            'file'
        );
    ELSE
        -- Safely add missing values to existing enum
        IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE pg_type.typname = 'data_source_type' AND enumlabel = 'cloud') THEN
            ALTER TYPE data_source_type ADD VALUE 'cloud';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE pg_type.typname = 'data_source_type' AND enumlabel = 'file') THEN
            ALTER TYPE data_source_type ADD VALUE 'file';
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type data_source_type NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'postgresql', 'epic', 'fitbit'
    config JSONB DEFAULT '{}' NOT NULL, -- Stores host, port, etc. (Encrypted in production)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected', 'pending')),
    error_message TEXT,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON public.data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON public.data_sources(type);

-- Enable RLS
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own data sources') THEN
        CREATE POLICY "Users can view their own data sources" ON public.data_sources
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own data sources') THEN
        CREATE POLICY "Users can create their own data sources" ON public.data_sources
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own data sources') THEN
        CREATE POLICY "Users can update their own data sources" ON public.data_sources
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own data sources') THEN
        CREATE POLICY "Users can delete their own data sources" ON public.data_sources
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON public.data_sources;
CREATE TRIGGER update_data_sources_updated_at
    BEFORE UPDATE ON public.data_sources
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
