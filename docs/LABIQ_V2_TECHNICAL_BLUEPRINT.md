# LAB-IQ V2: COMPLETE TECHNICAL IMPLEMENTATION BLUEPRINT
## Architecture, Specifications & Roadmap for Medical Research & Clinical Platform

**Document Version:** 1.0  
**Last Updated:** December 21, 2024  
**Target:** Lab-IQ V2.0 - Dual-Track Medical Platform  
**Timeline:** 18 months from kickoff

---

## 📋 TABLE OF CONTENTS

1. [System Architecture Overview](#system-architecture)
2. [Database Schema Complete](#database-schema)
3. [Backend Services Architecture](#backend-services)
4. [Frontend Components Specification](#frontend-components)
5. [Edge Functions & Microservices](#edge-functions)
6. [API Specifications](#api-specifications)
7. [Data Flow Diagrams](#data-flows)
8. [Integration Architecture](#integrations)
9. [Security & Compliance](#security)
10. [Implementation Roadmap](#roadmap)

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW {#system-architecture}

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ React Web App│  │ Mobile (PWA) │  │ Desktop (?)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                   (Supabase + Edge Functions)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│ CORE SERVICES   │  │   AI/ML      │  │  INTEGRATIONS   │
│ - Data Mgmt     │  │ - LabAI      │  │ - LIMS          │
│ - Experiments   │  │ - AutoML     │  │ - EHR/EMR       │
│ - Collaboration │  │ - Genomics   │  │ - PACS/DICOM    │
│ - Public Health │  │ - Pathology  │  │ - HL7/FHIR      │
└─────────────────┘  └──────────────┘  └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐   │
│  │ PostgreSQL│  │  Storage  │  │  Cache    │  │  Search  │   │
│  │ (Supabase)│  │  (S3)     │  │  (Redis)  │  │ (Elastic)│   │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                   │                   │
┌────────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│ PROCESSING      │  │   ANALYTICS  │  │   COMPLIANCE    │
│ - GPU Compute   │  │ - BI Engine  │  │ - Audit Logs    │
│ - Batch Jobs    │  │ - Metrics    │  │ - Encryption    │
│ - Epi-Analysis  │  │ - Reporting  │  │ - Backup        │
└─────────────────┘  └──────────────┘  └─────────────────┘
```

### **Technology Stack V2**

#### **Frontend:**
```typescript
Core: React 18+ with TypeScript
UI: shadcn/ui + Tailwind CSS
State: Zustand + React Query
Routing: React Router v6
Real-time: Supabase Realtime + WebSockets
Charts: Recharts + D3.js
Tables: TanStack Table v8
Forms: React Hook Form + Zod

NEW in V2:
- Genomics: IGV.js (genomic browser)
- Medical Imaging: Cornerstone.js (DICOM viewer)
- 3D Molecules: Mol* (protein structures)
- Pathology: OpenSeadragon (whole slide imaging)
- Chemistry: RDKit.js (molecular editor)
- Collaboration: WebRTC (video calls)
```

#### **Backend:**
```typescript
Platform: Supabase (PostgreSQL + Edge Functions)
Language: TypeScript (Deno runtime)
API: REST + GraphQL + Realtime
Auth: Supabase Auth + SAML SSO
Storage: Supabase Storage (S3-compatible)

NEW in V2:
- Message Queue: BullMQ + Redis
- Search: Elasticsearch / Typesense
- Cache: Redis
- GPU Compute: Modal.com / Replicate
- Batch Processing: Temporal.io
```

#### **AI/ML:**
```python
Primary: Python 3.11+
ML Framework: scikit-learn, XGBoost
Deep Learning: PyTorch, TensorFlow
LLM: GROQ (llama-3.3), OpenAI, Anthropic
Genomics: biopython, pysam, bcftools
Images: OpenCV, scikit-image
Pathology: HistomicsTK, cucim

NEW in V2:
- Protein: AlphaFold, ESMFold
- Chemistry: RDKit, DeepChem
- Medical NLP: spaCy + biomedical models
- Imaging AI: MONAI (medical imaging)
```

#### **Data Processing:**
```
Genomics Pipeline: Nextflow / Snakemake
Image Processing: CellProfiler, QuPath
Chemical: Mordred, ChemBERTa
Clinical: HL7 HAPI, FHIR Spark
```

#### **Infrastructure:**
```
Primary Host: Supabase Cloud
CDN: Cloudflare
Storage: AWS S3 (HIPAA-compliant)
Compute: Modal (GPU jobs) + Vercel (functions)
Monitoring: Sentry + PostHog
Analytics: Mixpanel + Custom
```

---

## 💾 DATABASE SCHEMA COMPLETE {#database-schema}

### **V1 Tables (Existing - 12 tables)**
```sql
-- Already implemented
datasets, experiments, team_members, chat_channels,
chat_messages, workflows, reports, notifications,
subscriptions, collaboration_activity, device_streams,
device_stream_data
```

### **V2 New Tables - Research Track (18 tables)**

#### **1. lab_notebooks**
```sql
CREATE TABLE lab_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  notebook_type VARCHAR(50) DEFAULT 'general', -- general, protocol, observation
  tags TEXT[],
  is_template BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  -- Compliance fields
  locked_at TIMESTAMPTZ, -- 21 CFR Part 11
  locked_by UUID REFERENCES auth.users(id),
  signature_required BOOLEAN DEFAULT FALSE,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

CREATE INDEX idx_lab_notebooks_search ON lab_notebooks USING gin(search_vector);
CREATE INDEX idx_lab_notebooks_lab ON lab_notebooks(lab_id);
CREATE INDEX idx_lab_notebooks_owner ON lab_notebooks(owner_id);
```

#### **2. notebook_entries**
```sql
CREATE TABLE notebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES lab_notebooks(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(255),
  content JSONB NOT NULL, -- Rich text (Tiptap JSON)
  author_id UUID REFERENCES auth.users(id),
  entry_type VARCHAR(50) DEFAULT 'observation', -- observation, procedure, result, note
  
  -- Attachments
  files JSONB DEFAULT '[]', -- [{ name, url, type, size }]
  linked_experiments UUID[],
  linked_datasets UUID[],
  linked_samples UUID[],
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES notebook_entries(id),
  
  -- Compliance
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES auth.users(id),
  witnessed_at TIMESTAMPTZ,
  witnessed_by UUID REFERENCES auth.users(id),
  digital_signature TEXT, -- Cryptographic signature
  
  -- Audit
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES auth.users(id),
  edit_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notebook_entries_notebook ON notebook_entries(notebook_id);
CREATE INDEX idx_notebook_entries_date ON notebook_entries(entry_date DESC);
CREATE INDEX idx_notebook_entries_author ON notebook_entries(author_id);
```

#### **3. protocols**
```sql
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lab_id UUID REFERENCES labs(id),
  category VARCHAR(100), -- molecular_biology, cell_culture, chemistry, etc.
  
  -- Protocol content
  steps JSONB NOT NULL, -- [{ step_num, title, description, duration, materials, notes }]
  materials JSONB DEFAULT '[]', -- [{ name, quantity, catalog_num, supplier }]
  equipment JSONB DEFAULT '[]', -- [{ name, model, settings }]
  safety_notes TEXT[],
  
  -- Metadata
  estimated_duration INTEGER, -- minutes
  difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
  success_rate DECIMAL(5,2), -- percentage
  times_used INTEGER DEFAULT 0,
  
  -- Versioning
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  parent_id UUID REFERENCES protocols(id), -- Original protocol if forked
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Authors
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  -- Compliance (SOP)
  sop_number VARCHAR(50) UNIQUE,
  effective_date DATE,
  review_date DATE,
  next_review_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_protocols_lab ON protocols(lab_id);
CREATE INDEX idx_protocols_category ON protocols(category);
CREATE INDEX idx_protocols_published ON protocols(is_published) WHERE is_published = TRUE;
```

#### **4. inventory_items (Reagents/Materials)**
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Item details
  name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- reagent, consumable, equipment, sample
  category VARCHAR(100), -- antibody, enzyme, media, plasticware, etc.
  
  -- Catalog info
  catalog_number VARCHAR(100),
  supplier VARCHAR(100),
  lot_number VARCHAR(100),
  cas_number VARCHAR(50), -- Chemical Abstract Service
  
  -- Quantities
  current_quantity DECIMAL(10,2),
  unit VARCHAR(50), -- ml, mg, units, items, etc.
  min_quantity DECIMAL(10,2), -- Reorder threshold
  max_quantity DECIMAL(10,2),
  
  -- Storage
  storage_location VARCHAR(255), -- Freezer A, Shelf 3, Box 12
  storage_temp VARCHAR(50), -- -80C, -20C, 4C, RT
  storage_conditions TEXT, -- Special requirements
  
  -- Dates & Status
  received_date DATE,
  opened_date DATE,
  expiration_date DATE,
  status VARCHAR(50) DEFAULT 'in_stock', -- in_stock, low_stock, ordered, expired
  
  -- Safety
  hazard_class VARCHAR(100), -- flammable, toxic, corrosive, etc.
  msds_url TEXT, -- Material Safety Data Sheet
  
  -- Cost
  unit_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Metadata
  notes TEXT,
  barcode VARCHAR(100),
  qr_code TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_lab ON inventory_items(lab_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_expiration ON inventory_items(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_inventory_type ON inventory_items(item_type);
```

#### **5. samples**
```sql
CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  
  -- Sample identification
  sample_id VARCHAR(100) UNIQUE NOT NULL, -- User-defined ID
  name VARCHAR(255) NOT NULL,
  sample_type VARCHAR(100) NOT NULL, -- dna, rna, protein, cell_line, tissue, serum, etc.
  organism VARCHAR(100), -- human, mouse, e.coli, etc.
  
  -- Source
  source_type VARCHAR(50), -- patient, cell_line, tissue_culture, environmental
  source_id VARCHAR(100), -- Link to external ID (patient ID, strain ID)
  parent_sample_id UUID REFERENCES samples(id), -- If derived from another sample
  
  -- Collection/Preparation
  collection_date DATE,
  collection_method TEXT,
  preparation_protocol_id UUID REFERENCES protocols(id),
  
  -- Quantity & Quality
  volume_ul DECIMAL(10,2), -- Volume in microliters
  concentration_ng_ul DECIMAL(10,2), -- Concentration
  purity_260_280 DECIMAL(5,2), -- DNA/RNA purity ratio
  purity_260_230 DECIMAL(5,2),
  quality_score VARCHAR(50), -- Good, Fair, Poor / QC metrics
  
  -- Storage
  storage_location VARCHAR(255), -- Freezer, Box, Position
  storage_temp VARCHAR(50),
  freezethaw_cycles INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- available, in_use, depleted, discarded
  
  -- Experimental use
  used_in_experiments UUID[], -- Array of experiment IDs
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  annotations TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_samples_lab ON samples(lab_id);
CREATE INDEX idx_samples_type ON samples(sample_type);
CREATE INDEX idx_samples_organism ON samples(organism);
CREATE INDEX idx_samples_status ON samples(status);
CREATE UNIQUE INDEX idx_samples_sample_id ON samples(sample_id);
```

#### **6. genomic_data**
```sql
CREATE TABLE genomic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES samples(id),
  
  -- File information
  file_type VARCHAR(50) NOT NULL, -- fastq, bam, vcf, bed, gff
  file_url TEXT NOT NULL, -- S3 path
  file_size_bytes BIGINT,
  
  -- Sequencing metadata
  sequencing_platform VARCHAR(100), -- illumina, nanopore, pacbio
  read_length INTEGER,
  read_type VARCHAR(20), -- single_end, paired_end
  coverage DECIMAL(6,2), -- Read depth
  
  -- Reference genome
  reference_genome VARCHAR(100), -- hg38, mm10, etc.
  genome_build VARCHAR(50),
  
  -- Quality metrics
  total_reads BIGINT,
  mapped_reads BIGINT,
  mapping_rate DECIMAL(5,2),
  q30_rate DECIMAL(5,2), -- Quality score
  gc_content DECIMAL(5,2),
  
  -- Analysis results
  variants_detected INTEGER,
  snps INTEGER,
  indels INTEGER,
  cnvs INTEGER,
  
  -- Processing
  pipeline_name VARCHAR(100), -- BWA-GATK, STAR-RSEM, etc.
  pipeline_version VARCHAR(50),
  processed_at TIMESTAMPTZ,
  
  -- Links
  vcf_file_url TEXT, -- Variant Call Format
  bam_index_url TEXT, -- BAM index file
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_genomic_dataset ON genomic_data(dataset_id);
CREATE INDEX idx_genomic_sample ON genomic_data(sample_id);
CREATE INDEX idx_genomic_type ON genomic_data(file_type);
```

#### **7. protein_structures** 
```sql
CREATE TABLE protein_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  
  -- Protein identity
  protein_name VARCHAR(255) NOT NULL,
  uniprot_id VARCHAR(50), -- UniProt accession
  gene_name VARCHAR(100),
  organism VARCHAR(100),
  
  -- Sequence
  amino_acid_sequence TEXT,
  sequence_length INTEGER,
  molecular_weight_kda DECIMAL(8,2),
  
  -- Structure
  pdb_id VARCHAR(10), -- Protein Data Bank ID
  structure_file_url TEXT, -- PDB/CIF/mmCIF file in S3
  structure_source VARCHAR(50), -- experimental, alphafold, homology_model
  resolution_angstrom DECIMAL(5,2),
  
  -- AlphaFold prediction
  alphafold_confidence DECIMAL(5,2), -- pLDDT score
  prediction_date TIMESTAMPTZ,
  
  -- Annotations
  domains JSONB, -- [{ name, start, end, pfam_id }]
  binding_sites JSONB, -- [{ type, residues, ligand }]
  modifications JSONB, -- PTMs
  
  -- Visualization
  thumbnail_url TEXT,
  viewer_session JSONB, -- Saved view state
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_protein_dataset ON protein_structures(dataset_id);
CREATE INDEX idx_protein_uniprot ON protein_structures(uniprot_id);
CREATE INDEX idx_protein_pdb ON protein_structures(pdb_id);
```

#### **8. chemical_compounds**
```sql
CREATE TABLE chemical_compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  
  -- Chemical identity
  compound_name VARCHAR(255),
  iupac_name TEXT,
  smiles TEXT, -- Simplified molecular input
  inchi TEXT, -- International Chemical Identifier  
  inchi_key VARCHAR(27),
  
  -- Structure
  molecular_formula VARCHAR(100),
  molecular_weight DECIMAL(10,4),
  structure_file_url TEXT, -- SDF/MOL file
  structure_2d_svg TEXT, -- SVG rendering
  
  -- Properties
  logp DECIMAL(6,2), -- Lipophilicity
  tpsa DECIMAL(7,2), -- Topological polar surface area
  hbd INTEGER, -- H-bond donors
  hba INTEGER, -- H-bond acceptors
  rotatable_bonds INTEGER,
  aromatic_rings INTEGER,
  
  -- Drug-likeness
  lipinski_violations INTEGER,
  bioavailability_score DECIMAL(4,2),
  
  -- Identifiers
  cas_number VARCHAR(50),
  pubchem_cid VARCHAR(50),
  chembl_id VARCHAR(50),
  drugbank_id VARCHAR(50),
  
  -- Activity
  biological_activity TEXT[],
  targets JSONB, -- [{ target, affinity, assay }]
  
  -- Experimental data
  ic50_values JSONB, -- [{ assay, value, unit }]
  ki_values JSONB,
  ec50_values JSONB,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compounds_dataset ON chemical_compounds(dataset_id);
CREATE INDEX idx_compounds_inchi_key ON chemical_compounds(inchi_key);
CREATE INDEX idx_compounds_formula ON chemical_compounds(molecular_formula);
```

#### **9. microscopy_images**
```sql
CREATE TABLE microscopy_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  experiment_id UUID REFERENCES experiments(id),
  
  -- Image files
  image_url TEXT NOT NULL,
  file_format VARCHAR(50), -- tiff, nd2, czi, ome-tiff
  file_size_bytes BIGINT,
  
  -- Acquisition
  microscope_type VARCHAR(100), -- confocal, widefield, electron, etc.
  objective VARCHAR(50), -- 20x, 40x, 100x
  magnification DECIMAL(6,2),
  numerical_aperture DECIMAL(4,2),
  
  -- Image properties
  width_pixels INTEGER,
  height_pixels INTEGER,
  channels INTEGER,
  z_stacks INTEGER,
  timepoints INTEGER,
  pixel_size_um DECIMAL(8,4), -- Micrometers per pixel
  
  -- Channels
  channel_info JSONB, -- [{ name, wavelength, exposure, filter }]
  
  -- Metadata
  acquisition_date TIMESTAMPTZ,
  acquisition_software VARCHAR(100),
  
  -- Analysis
  analyzed BOOLEAN DEFAULT FALSE,
  cell_count INTEGER,
  analysis_results JSONB,
  
  -- Annotations
  roi_annotations JSONB, -- Regions of interest
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_microscopy_dataset ON microscopy_images(dataset_id);
CREATE INDEX idx_microscopy_experiment ON microscopy_images(experiment_id);
```

#### **10-18. Additional Research Tables**
```sql
-- 10. equipment_logs (instrument usage tracking)
-- 11. plate_layouts (96/384-well plate designs)
-- 12. flow_cytometry (FACS data)
-- 13. mass_spec_runs (MS data)
-- 14. gel_images (western blots, etc.)
-- 15. qpcr_results (quantitative PCR)
-- 16. cell_lines (cell culture tracking)
-- 17. antibodies (antibody inventory)
-- 18. publications (citation management)

-- Schema available on request
```

---

### **V2 New Tables - Clinical Track (14 tables)**

#### **19. patient_cohorts**
```sql
CREATE TABLE patient_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cohort identification
  cohort_name VARCHAR(255) NOT NULL,
  cohort_code VARCHAR(50) UNIQUE,
  description TEXT,
  
  -- Study info
  study_type VARCHAR(100), -- clinical_trial, observational, registry
  indication VARCHAR(255), -- Disease/condition
  phase VARCHAR(50), -- Phase I, II, III, IV
  
  -- Inclusion/Exclusion
  inclusion_criteria JSONB,
  exclusion_criteria JSONB,
  
  -- Demographics (de-identified aggregates)
  patient_count INTEGER,
  age_range_min INTEGER,
  age_range_max INTEGER,
  gender_distribution JSONB,
  ethnicity_distribution JSONB,
  
  -- Timeline
  enrollment_start DATE,
  enrollment_end DATE,
  study_duration_months INTEGER,
  
  -- Compliance
  irb_number VARCHAR(100), -- Institutional Review Board
  irb_approval_date DATE,
  consent_version VARCHAR(50),
  
  -- Status
  status VARCHAR(50), -- recruiting, active, completed, terminated
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cohorts_study_type ON patient_cohorts(study_type);
CREATE INDEX idx_cohorts_status ON patient_cohorts(status);
```

#### **20. clinical_trial_data**
```sql
CREATE TABLE clinical_trial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES patient_cohorts(id) ON DELETE CASCADE,
  
  -- De-identified patient
  patient_code VARCHAR(100) NOT NULL, -- De-identified ID
  enrollment_date DATE,
  
  -- Baseline characteristics (de-identified)
  age_group VARCHAR(20), -- 18-25, 26-35, etc.
  gender VARCHAR(20),
  ethnicity VARCHAR(50),
  
  -- Study arm
  treatment_arm VARCHAR(100),
  randomization_date DATE,
  
  -- Endpoints
  primary_endpoint_value DECIMAL(10,2),
  primary_endpoint_unit VARCHAR(50),
  secondary_endpoints JSONB,
  
  -- Safety
  adverse_events JSONB, -- [{ event, grade, date, resolution }]
  serious_adverse_events INTEGER DEFAULT 0,
  
  -- Treatment
  treatment_start_date DATE,
  treatment_end_date DATE,
  doses_administered INTEGER,
  protocol_deviations JSONB,
  
  -- Outcomes
  outcome_status VARCHAR(50), -- completed, discontinued, lost_to_followup
  outcome_date DATE,
  efficacy_assessment VARCHAR(100),
  
  -- Follow-up
  last_visit_date DATE,
  next_visit_date DATE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinical_trial_cohort ON clinical_trial_data(cohort_id);
CREATE INDEX idx_clinical_trial_patient ON clinical_trial_data(patient_code);
```

#### **21. medical_images**
```sql
CREATE TABLE medical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  
  -- DICOM metadata
  dicom_url TEXT NOT NULL,
  modality VARCHAR(50) NOT NULL, -- CT, MRI, X-RAY, PET, US
  body_part VARCHAR(100),
  
  -- Study information (de-identified)
  study_instance_uid VARCHAR(255),
  series_instance_uid VARCHAR(255),
  sop_instance_uid VARCHAR(255),
  
  -- Acquisition
  study_date DATE,
  series_description TEXT,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  
  -- Image properties
  rows INTEGER,
  columns INTEGER,
  slices INTEGER,
  pixel_spacing_mm DECIMAL(8,4),
  slice_thickness_mm DECIMAL(6,2),
  
  -- Contrast
  contrast_agent VARCHAR(100),
  contrast_bolus BOOLEAN,
  
  -- Processing
  reconstruction_algorithm VARCHAR(100),
  window_center DECIMAL(10,2),
  window_width DECIMAL(10,2),
  
  -- AI Analysis
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_findings JSONB, -- [{ finding, confidence, location }]
  radiologist_review JSONB,
  
  -- Annotations
  annotations JSONB, -- [{ type, coordinates, label, annotator }]
  
  -- Compliance (de-identified)
  patient_age_years INTEGER,
  patient_sex VARCHAR(10),
  accession_number VARCHAR(100),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_images_dataset ON medical_images(dataset_id);
CREATE INDEX idx_medical_images_modality ON medical_images(modality);
CREATE INDEX idx_medical_images_study ON medical_images(study_instance_uid);
```

#### **22. pathology_slides**
```sql
CREATE TABLE pathology_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  
  -- Slide identification
  slide_id VARCHAR(100) UNIQUE NOT NULL,
  case_number VARCHAR(100),
  
  -- Specimen
  tissue_type VARCHAR(100), -- liver, lung, breast, etc.
  specimen_site VARCHAR(100),
  collection_date DATE,
  
  -- Processing
  staining_type VARCHAR(100), -- H&E, IHC, IF, etc.
  stain_protocol VARCHAR(255),
  preparation_date DATE,
  
  -- Digital image (Whole Slide Imaging)
  wsi_url TEXT, -- Whole slide image file
  image_format VARCHAR(50), -- svs, ndpi, mrxs
  file_size_bytes BIGINT,
  
  -- Image properties
  magnification VARCHAR(50), -- 20x, 40x
  width_pixels INTEGER,
  height_pixels INTEGER,
  mpp_x DECIMAL(8,4), -- Microns per pixel
  mpp_y DECIMAL(8,4),
  
  -- Diagnosis (de-identified)
  pathology_diagnosis TEXT,
  tumor_grade VARCHAR(50),
  tumor_stage VARCHAR(50),
  
  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_detections JSONB, -- [{ class, confidence, bbox }]
  tumor_percentage DECIMAL(5,2),
  
  -- Annotations
  pathologist_annotations JSONB,
  roi_coordinates JSONB,
  
  -- QC
  scan_quality VARCHAR(50),
  focus_issues BOOLEAN,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pathology_dataset ON pathology_slides(dataset_id);
CREATE INDEX idx_pathology_tissue ON pathology_slides(tissue_type);
CREATE INDEX idx_pathology_stain ON pathology_slides(staining_type);
### **V2 New Tables - Public Health Track (10 tables)**

#### **33. public_health_datasets**
```sql
CREATE TABLE public_health_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source_org VARCHAR(255), -- WHO, CDC, MoH
  geo_scope VARCHAR(100), -- global, national, regional
  data_type VARCHAR(50), -- epidemiological, survey, environmental
  
  -- Metadata
  sample_size BIGINT,
  time_period_start DATE,
  time_period_end DATE,
  update_frequency VARCHAR(50),
  
  -- Compliance
  is_anonymized BOOLEAN DEFAULT TRUE,
  ethics_approval_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ph_datasets_scope ON public_health_datasets(geo_scope);
CREATE INDEX idx_ph_datasets_type ON public_health_datasets(data_type);
```

#### **34. disease_outbreaks**
```sql
CREATE TABLE disease_outbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name VARCHAR(255) NOT NULL,
  icd_10_code VARCHAR(20),
  
  -- Location
  region VARCHAR(255),
  country_code CHAR(2),
  coordinates GEOGRAPHY(POINT),
  
  -- Stats
  cases_confirmed INTEGER DEFAULT 0,
  cases_suspected INTEGER DEFAULT 0,
  mortality_count INTEGER DEFAULT 0,
  recovery_count INTEGER DEFAULT 0,
  
  -- Timeline
  onset_date DATE,
  peak_date DATE,
  resolution_date DATE,
  
  -- Indicators
  r_naught DECIMAL(5,2), -- Basic reproduction number
  severity_index INTEGER, -- 1-10
  
  status VARCHAR(50), -- active, monitoring, contained, resolved
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbreaks_status ON disease_outbreaks(status);
CREATE INDEX idx_outbreaks_disease ON disease_outbreaks(disease_name);
```

#### **35. vaccination_records**
```sql
CREATE TABLE vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_type VARCHAR(100) NOT NULL,
  target_disease VARCHAR(100),
  
  -- Metrics
  doses_administered BIGINT,
  coverage_percentage DECIMAL(5,2),
  target_population BIGINT,
  
  -- Adverse events
  vaers_reports INTEGER,
  serious_reactions INTEGER,
  
  -- Geography
  region VARCHAR(255),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **36. environmental_factors**
```sql
CREATE TABLE environmental_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID,
  record_date DATE,
  
  -- Air Quality
  aqi INTEGER,
  pm2_5 DECIMAL(6,2),
  pm10 DECIMAL(6,2),
  
  -- Climate
  avg_temp DECIMAL(4,2),
  humidity DECIMAL(4,2),
  precipitation_mm DECIMAL(6,2),
  
  -- Water Quality
  water_safety_score INTEGER,
  contaminants JSONB,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **37. policy_impacts**
```sql
CREATE TABLE policy_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  implementation_date DATE,
  
  -- Scope
  category VARCHAR(100), -- lockdown, mask_mandate, vaccine_passport, travel_ban
  jurisdiction VARCHAR(255),
  
  -- Impact Metrics
  compliance_rate DECIMAL(5,2),
  mobility_reduction_percent DECIMAL(5,2),
  case_reduction_percent DECIMAL(5,2),
  
  -- Economic 
  cost_estimate_usd DECIMAL(15,2),
  gdp_impact_percent DECIMAL(5,2),
  
  analysis_report_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏗️ IMPLEMENTATION ROADMAP {#roadmap}

### **Phase 1: Research Foundation (Months 1-4)**
- [x] V1 core feature polish
- [ ] ELN & Inventory management
- [ ] Sample tracking & Biobanking
- [ ] Security audits (GxP ready)

### **Phase 2: Clinical Expansion (Months 5-9)**
- [ ] DICOM & PACS integration
- [ ] Whole Slide Imaging (Pathology)
- [ ] FHIR/HL7 integration
- [ ] HIPAA/FDA 21 CFR compliance certification

### **Phase 3: Deep AI & Genomics (Months 10-14)**
- [ ] Multi-omics pipelines
- [ ] AlphaFold integration
- [ ] Predictive health modeling
- [ ] Advanced AutoML for clinicians

### **Phase 4: Public Health & Global Surveillance (Months 15-18)**
- [ ] Epidemiological data feeds
- [ ] Outbreak predictive modeling
- [ ] Global health policy simulator
- [ ] Real-time disease surveillance dashboard

---

## 💰 SUMMARY & VALUE PROPOSITION
Lab-IQ V2 evolves from a research tool into a **Comprehensive Health OS**. By unifying **Research**, **Clinical**, and **Public Health** data, it provides an unprecedented 360-degree view of human health—from molecular structure to global outbreaks.
