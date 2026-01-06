-- ============================================================================
-- LabIQ Health - Dataset Infrastructure Enhancements V2
-- Version: 2.0
-- Date: 2025-12-26
-- 
-- This migration adds:
-- 1. Dataset versioning (version chains)
-- 2. Domain classification (health, clinical, biopharma, etc.)
-- 3. Enhanced anonymization tracking
-- 4. Provenance tracking (data lineage)
-- 5. Data quality scores
-- ============================================================================

-- ============================================================================
-- DATASET VERSIONING
-- ============================================================================

-- Add versioning columns to datasets table
ALTER TABLE public.datasets 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.datasets(id),
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- Add domain classification
DO $$ BEGIN
    CREATE TYPE dataset_domain AS ENUM (
        'health',
        'clinical', 
        'biopharma',
        'environmental',
        'population',
        'general'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.datasets
ADD COLUMN IF NOT EXISTS domain dataset_domain DEFAULT 'general',
ADD COLUMN IF NOT EXISTS domain_confidence DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS domain_indicators JSONB DEFAULT '[]';

-- Add anonymization tracking
ALTER TABLE public.datasets
ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phi_fields_masked TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS anonymization_method TEXT,
ADD COLUMN IF NOT EXISTS anonymization_log JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

-- Add provenance tracking
ALTER TABLE public.datasets
ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lineage_chain UUID[] DEFAULT '{}';

-- Add quality score
ALTER TABLE public.datasets
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_breakdown JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_quality_check TIMESTAMPTZ;

-- ============================================================================
-- DATASET VERSIONS TABLE (for detailed version history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Version metadata
    change_summary TEXT,
    change_type TEXT CHECK (change_type IN ('initial', 'update', 'transform', 'merge', 'anonymize', 'enrich')),
    rows_added INTEGER DEFAULT 0,
    rows_removed INTEGER DEFAULT 0,
    rows_modified INTEGER DEFAULT 0,
    columns_added TEXT[] DEFAULT '{}',
    columns_removed TEXT[] DEFAULT '{}',
    
    -- Snapshot info
    snapshot_row_count INTEGER,
    snapshot_column_count INTEGER,
    snapshot_size_bytes BIGINT,
    snapshot_checksum TEXT,
    
    -- Provenance
    source_version_id UUID REFERENCES public.dataset_versions(id),
    transformation_applied JSONB DEFAULT '{}',

    UNIQUE(dataset_id, version)
);

-- ============================================================================
-- DATA LINEAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_lineage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    source_type TEXT NOT NULL CHECK (source_type IN ('dataset', 'experiment', 'model', 'external', 'device', 'api')),
    source_id UUID,
    source_name TEXT,
    source_metadata JSONB DEFAULT '{}',
    
    -- Target
    target_type TEXT NOT NULL CHECK (target_type IN ('dataset', 'experiment', 'model', 'report', 'insight')),
    target_id UUID NOT NULL,
    target_name TEXT,
    
    -- Transformation
    transformation_type TEXT,
    transformation_params JSONB DEFAULT '{}',
    transformation_description TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Audit
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ
);

-- ============================================================================
-- ANONYMIZATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.anonymization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    
    -- Anonymization details
    method TEXT NOT NULL CHECK (method IN ('masking', 'hashing', 'k_anonymity', 'differential_privacy', 'generalization', 'suppression')),
    fields_processed TEXT[] NOT NULL,
    records_affected INTEGER DEFAULT 0,
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- Compliance
    complies_with TEXT[] DEFAULT '{}', -- e.g., ['HIPAA', 'GDPR']
    certification_level TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Audit
    performed_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approval_notes TEXT,
    
    -- Rollback info
    is_reversible BOOLEAN DEFAULT false,
    reversal_key_hash TEXT
);

-- ============================================================================
-- DOMAIN CLASSIFICATION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.domain_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    
    -- Classification
    domain dataset_domain NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    indicators JSONB DEFAULT '[]',
    
    -- Model info
    model_used TEXT DEFAULT 'ai_classifier',
    model_version TEXT,
    
    -- Timing
    classified_at TIMESTAMPTZ DEFAULT NOW(),
    classified_by TEXT DEFAULT 'system', -- 'system' or user_id
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    correction_reason TEXT
);

-- ============================================================================
-- QUALITY CHECKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    
    -- Check details
    check_type TEXT NOT NULL CHECK (check_type IN ('completeness', 'accuracy', 'consistency', 'validity', 'timeliness', 'full')),
    score DECIMAL(5,2) NOT NULL,
    threshold DECIMAL(5,2) DEFAULT 80.00,
    passed BOOLEAN GENERATED ALWAYS AS (score >= threshold) STORED,
    
    -- Issues found
    issues JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Timing
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    
    -- Trigger
    trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'upload', 'scheduled', 'event'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_datasets_version ON public.datasets(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_datasets_domain ON public.datasets(domain);
CREATE INDEX IF NOT EXISTS idx_datasets_anonymized ON public.datasets(is_anonymized);
CREATE INDEX IF NOT EXISTS idx_datasets_quality ON public.datasets(quality_score);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset ON public.dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON public.data_lineage(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_target ON public.data_lineage(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_anonymization_logs_dataset ON public.anonymization_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_domain_classifications_dataset ON public.domain_classifications(dataset_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_dataset ON public.quality_checks(dataset_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Dataset versions RLS
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view versions of their datasets" ON public.dataset_versions;
CREATE POLICY "Users can view versions of their datasets" ON public.dataset_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = dataset_versions.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create versions for their datasets" ON public.dataset_versions;
CREATE POLICY "Users can create versions for their datasets" ON public.dataset_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = dataset_versions.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

-- Data lineage RLS
ALTER TABLE public.data_lineage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their data lineage" ON public.data_lineage;
CREATE POLICY "Users can view their data lineage" ON public.data_lineage
    FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create lineage records" ON public.data_lineage;
CREATE POLICY "Users can create lineage records" ON public.data_lineage
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Anonymization logs RLS
ALTER TABLE public.anonymization_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view anonymization logs for their datasets" ON public.anonymization_logs;
CREATE POLICY "Users can view anonymization logs for their datasets" ON public.anonymization_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = anonymization_logs.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create anonymization logs" ON public.anonymization_logs;
CREATE POLICY "Users can create anonymization logs" ON public.anonymization_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = anonymization_logs.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

-- Domain classifications RLS
ALTER TABLE public.domain_classifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view domain classifications for their datasets" ON public.domain_classifications;
CREATE POLICY "Users can view domain classifications for their datasets" ON public.domain_classifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = domain_classifications.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

-- Quality checks RLS  
ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quality checks for their datasets" ON public.quality_checks;
CREATE POLICY "Users can view quality checks for their datasets" ON public.quality_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = quality_checks.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create quality checks" ON public.quality_checks;
CREATE POLICY "Users can create quality checks" ON public.quality_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.datasets 
            WHERE datasets.id = quality_checks.dataset_id 
            AND datasets.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create a new dataset version
CREATE OR REPLACE FUNCTION create_dataset_version(
    p_dataset_id UUID,
    p_change_summary TEXT DEFAULT NULL,
    p_change_type TEXT DEFAULT 'update'
) RETURNS UUID AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
    v_version_id UUID;
BEGIN
    -- Get current version
    SELECT version INTO v_current_version FROM public.datasets WHERE id = p_dataset_id;
    v_new_version := COALESCE(v_current_version, 0) + 1;
    
    -- Mark old versions as not latest
    UPDATE public.datasets SET is_latest_version = false WHERE id = p_dataset_id;
    
    -- Update dataset version
    UPDATE public.datasets 
    SET version = v_new_version, is_latest_version = true
    WHERE id = p_dataset_id;
    
    -- Create version record
    INSERT INTO public.dataset_versions (dataset_id, version, change_summary, change_type, created_by)
    VALUES (p_dataset_id, v_new_version, p_change_summary, p_change_type, auth.uid())
    RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
    p_completeness DECIMAL,
    p_accuracy DECIMAL,
    p_consistency DECIMAL,
    p_validity DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    -- Weighted average: completeness 30%, accuracy 30%, consistency 20%, validity 20%
    RETURN (p_completeness * 0.30) + (p_accuracy * 0.30) + (p_consistency * 0.20) + (p_validity * 0.20);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE public.dataset_versions IS 'Track version history for datasets';
COMMENT ON TABLE public.data_lineage IS 'Track data provenance and transformations';
COMMENT ON TABLE public.anonymization_logs IS 'Audit log for data anonymization operations';
COMMENT ON TABLE public.domain_classifications IS 'History of domain classifications';
COMMENT ON TABLE public.quality_checks IS 'Data quality check results';
