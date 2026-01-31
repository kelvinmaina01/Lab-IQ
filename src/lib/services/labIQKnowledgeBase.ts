/**
 * DataIQ Knowledge Base
 * Comprehensive knowledge about DataIQ platform for AI agent responses
 */

export const LAB_IQ_KNOWLEDGE_BASE = {
  // ===== COMPANY & PRODUCT OVERVIEW =====
  overview: {
    name: "LabIQ Health",
    tagline: "AI-Powered Laboratory Intelligence Platform",
    description: "LabIQ Health is a comprehensive AI-powered platform that transforms how laboratories collect, analyze, and collaborate on research data. It combines multi-source data ingestion, Google Gemini AI analysis, real-time collaboration, and automated workflows to accelerate scientific discoveries.",
    mission: "To democratize advanced data analysis and make AI-powered insights accessible to every researcher, regardless of their technical background.",
    keyBenefits: [
      "10x faster data analysis with AI automation",
      "99.9% accuracy in pattern detection",
      "Support for 10+ data source types",
      "Real-time team collaboration",
      "No coding required for advanced analysis"
    ]
  },

  // ===== CORE FEATURES =====
  features: {
    dataIngestion: {
      name: "Multi-Source Data Ingestion",
      description: "Upload and connect data from multiple sources including file uploads (CSV, Excel, JSON, XML), cloud platforms (AWS, Google Cloud, Azure, Dropbox), live device streams, wearables, IoT sensors, and database connections.",
      supportedFormats: ["CSV", "Excel (XLSX, XLS)", "JSON", "XML", "Parquet", "TXT"],
      cloudIntegrations: ["AWS S3", "Google Cloud Storage", "Azure Blob", "Dropbox", "OneDrive"],
      deviceSupport: ["Smartwatches", "Fitness trackers", "Biosensors", "Lab equipment", "IoT sensors"],
      maxFileSize: "50MB per file (Pro), 200MB per file (Enterprise)",
      processingSpeed: "Real-time parsing with progress indicators"
    },
    aiAnalysis: {
      name: "AI-Powered Analysis",
      description: "Google Gemini AI integration provides three powerful analysis modes: Analysis Mode for pattern detection, Educator Mode for explanations, and Prediction Mode for forecasting.",
      modes: {
        analysis: "Automatic pattern detection, anomaly identification, and statistical insights",
        educator: "Plain-English explanations of your data, suitable for non-technical stakeholders",
        prediction: "Machine learning predictions and forecasting based on historical patterns"
      },
      autoML: {
        algorithms: "16+ ML algorithms including Random Forest, XGBoost, Neural Networks, SVM, K-Means",
        featureEngineering: "Automatic feature selection, encoding, and normalization",
        modelAccuracy: "90%+ accuracy target with automatic hyperparameter tuning"
      }
    },
    experiments: {
      name: "Experiment Tracking",
      description: "Track all your experiments with full version history, parameter logging, and result visualization.",
      features: [
        "Create and manage experiments",
        "Track parameters and configurations",
        "Compare results across runs",
        "Visualize metrics and performance",
        "Export results and reports"
      ]
    },
    workflows: {
      name: "Workflow Automation",
      description: "Build automated data processing pipelines with a visual workflow builder. Schedule workflows, trigger on events, and monitor execution in real-time.",
      capabilities: [
        "Visual drag-and-drop workflow builder",
        "Scheduled execution (cron)",
        "Event-triggered workflows",
        "Step-by-step execution monitoring",
        "Error handling and retry logic",
        "Email notifications on completion"
      ]
    },
    collaboration: {
      name: "Team Collaboration",
      description: "Real-time collaboration features including chat, threaded comments, task assignments, and email notifications.",
      features: [
        "Real-time chat within datasets and experiments",
        "Threaded comments on specific data points",
        "Task assignments with deadlines",
        "Email notifications for updates",
        "@mentions and team alerts",
        "Activity feed and audit logs"
      ]
    },
    reports: {
      name: "Automated Reporting",
      description: "Generate comprehensive reports with AI-written summaries, charts, and insights. Export to PDF, Word, or share online.",
      reportTypes: [
        "Executive summaries",
        "Technical analysis reports",
        "Compliance documentation",
        "Custom templates"
      ],
      exportFormats: ["PDF", "Word", "HTML", "Markdown"]
    },
    security: {
      name: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption, role-based access control, audit logs, and compliance certifications.",
      features: [
        "End-to-end encryption (AES-256)",
        "Role-based access control (RBAC)",
        "Complete audit logs",
        "Data anonymization tools",
        "SSO/SAML support (Enterprise)",
        "On-premise deployment option (Enterprise)"
      ],
      compliance: ["HIPAA-ready", "GDPR compliant", "SOC 2 Type II (in progress)"]
    }
  },

  // ===== PRICING DETAILS =====
  pricing: {
    currency: "USD",
    billingCycles: ["Monthly", "Annual (20% discount)"],
    tiers: {
      free: {
        name: "Free",
        price: 0,
        description: "Perfect for students and exploring DataIQ",
        datasets: 5,
        storage: "100 MB",
        users: 1,
        autoMLModels: 3,
        support: "Community",
        features: [
          "5 datasets",
          "100 MB storage",
          "Basic AutoML (3 models)",
          "Community support",
          "Public data only",
          "Standard visualizations"
        ]
      },
      pro: {
        name: "Pro",
        monthlyPrice: 49,
        annualPrice: 470,
        annualSavings: 118,
        description: "For serious researchers and small labs",
        datasets: 100,
        storage: "10 GB",
        users: 5,
        autoMLModels: "16+",
        support: "Priority email (24h response)",
        features: [
          "100 datasets",
          "10 GB storage",
          "Full AutoML (16+ algorithms)",
          "Domain-specific parsers",
          "Priority support",
          "Private data",
          "Team collaboration (5 users)",
          "API access",
          "Advanced visualizations",
          "Export to PDF/CSV"
        ],
        trialDays: 14
      },
      team: {
        name: "Team",
        monthlyPrice: 149,
        annualPrice: 1430,
        annualSavings: 358,
        description: "For multi-team labs and mid-size organizations",
        datasets: 500,
        storage: "50 GB",
        users: 25,
        autoMLModels: "16+",
        support: "Phone + Email (4h response)",
        sla: "99.5% uptime",
        features: [
          "500 datasets",
          "50 GB storage",
          "All Pro features",
          "Advanced compliance tools",
          "Team collaboration (25 users)",
          "Custom integrations",
          "Phone support",
          "SLA (99.5% uptime)",
          "Audit logs",
          "Version history"
        ],
        trialDays: 14
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        description: "For large pharma, hospitals, and research institutions",
        datasets: "Unlimited",
        storage: "Unlimited",
        users: "Unlimited",
        autoMLModels: "16+ with custom models",
        support: "Dedicated account manager (1h response)",
        sla: "99.9% uptime",
        features: [
          "Unlimited datasets",
          "Unlimited storage",
          "All features included",
          "White-label option",
          "On-premise deployment",
          "Custom integrations",
          "Dedicated support",
          "SLA (99.9% uptime)",
          "Training & onboarding",
          "Legal agreements",
          "SSO/SAML",
          "Custom SLA"
        ]
      }
    },
    academicDiscount: "50% off for verified academic institutions and non-profits",
    refundPolicy: "30-day money-back guarantee on all paid plans",
    upgradePolicy: "Upgrade or downgrade anytime. Changes take effect immediately with prorated billing."
  },

  // ===== USE CASES =====
  useCases: [
    {
      industry: "Chemistry & Materials Science",
      description: "Analyze spectroscopy data, track synthesis experiments, predict material properties",
      keyFeatures: ["Spectral analysis", "Reaction optimization", "Property prediction"]
    },
    {
      industry: "Biology & Life Sciences",
      description: "Process genomics data, track cell experiments, analyze microscopy images",
      keyFeatures: ["Sequence analysis", "Cell tracking", "Image processing"]
    },
    {
      industry: "Clinical Trials & Diagnostics",
      description: "Manage patient data, track trial outcomes, ensure regulatory compliance",
      keyFeatures: ["Patient data management", "Outcome tracking", "HIPAA compliance"]
    },
    {
      industry: "Agricultural Research",
      description: "Monitor crop data, analyze soil samples, predict yields",
      keyFeatures: ["IoT sensor integration", "Yield prediction", "Environmental tracking"]
    },
    {
      industry: "Environmental Science",
      description: "Track environmental samples, monitor pollution, model climate data",
      keyFeatures: ["Sample tracking", "Time-series analysis", "Geospatial visualization"]
    },
    {
      industry: "Quality Control & Testing",
      description: "Automate QC workflows, track defects, ensure compliance",
      keyFeatures: ["Automated testing", "Defect tracking", "Compliance reporting"]
    }
  ],

  // ===== TECHNICAL SPECIFICATIONS =====
  technical: {
    architecture: "Cloud-native SaaS with optional on-premise deployment",
    frontend: "React with TypeScript, Tailwind CSS, Recharts for visualization",
    backend: "Supabase (PostgreSQL), Edge Functions, Real-time subscriptions",
    ai: "Google Gemini Pro API with streaming support",
    security: {
      encryption: "AES-256 at rest, TLS 1.3 in transit",
      authentication: "Supabase Auth with MFA support",
      authorization: "Row-level security (RLS) policies"
    },
    uptime: {
      free: "Best effort",
      pro: "99% target",
      team: "99.5% SLA",
      enterprise: "99.9% SLA with credits"
    },
    dataRetention: {
      free: "30 days inactive data deletion",
      pro: "1 year retention",
      team: "3 years retention",
      enterprise: "Custom retention policies"
    }
  },

  // ===== GETTING STARTED =====
  gettingStarted: {
    steps: [
      "Sign up for a free account (no credit card required)",
      "Create your first project workspace",
      "Upload your data (drag and drop)",
      "Let AI analyze patterns automatically",
      "Review insights and predictions",
      "Generate and share reports"
    ],
    timeToValue: "Most users see insights within 5 minutes of uploading data",
    onboarding: "Interactive guided tour available in the Settings menu"
  },

  // ===== SUPPORT =====
  support: {
    documentation: "Comprehensive docs at docs.LabIQ Health.com",
    community: "Active Discord community with 1000+ researchers",
    email: "support@LabIQ Health.com",
    responseTime: {
      free: "Best effort (48-72 hours)",
      pro: "24 hours",
      team: "4 hours",
      enterprise: "1 hour with dedicated manager"
    },
    training: {
      free: "Self-service documentation",
      pro: "Video tutorials and documentation",
      team: "Monthly webinars",
      enterprise: "On-site training available"
    }
  },

  // ===== COMMON QUESTIONS =====
  faq: {
    billing: [
      {
        q: "Can I change plans at any time?",
        a: "Yes! Upgrade or downgrade your plan anytime. Changes take effect immediately, and we'll prorate any differences."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and wire transfers for Enterprise plans."
      },
      {
        q: "Is there a free trial for Pro plans?",
        a: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start."
      },
      {
        q: "What happens to my data if I downgrade?",
        a: "Your data is never deleted. If you exceed the new plan's limits, you'll have read-only access until you upgrade or remove data."
      },
      {
        q: "Do you offer academic discounts?",
        a: "Yes! We offer 50% discounts for verified academic institutions and non-profit research organizations. Contact us with your institutional email."
      }
    ],
    features: [
      {
        q: "What file formats do you support?",
        a: "LabIQ Health supports CSV, Excel (XLSX, XLS), JSON, XML, Parquet, and plain text files. We're constantly adding more formats."
      },
      {
        q: "How does the AI analysis work?",
        a: "LabIQ Health uses Google Gemini AI to automatically analyze your data. It detects patterns, identifies anomalies, and provides insights in plain English. You can choose Analysis mode for patterns, Educator mode for explanations, or Prediction mode for forecasting."
      },
      {
        q: "Can I connect my lab equipment?",
        a: "Yes! DataIQ supports live device streams from lab equipment, IoT sensors, wearables, and more. Data flows in real-time for continuous monitoring."
      },
      {
        q: "Is my data secure?",
        a: "Absolutely. We use bank-grade AES-256 encryption, TLS 1.3 for data in transit, row-level security policies, and comprehensive audit logs. Enterprise plans include additional compliance certifications."
      }
    ],
    technical: [
      {
        q: "Do I need coding skills to use DataIQ?",
        a: "No coding required! DataIQ is designed for researchers of all technical levels. Upload your data, and the AI handles the analysis. Power users can access APIs and custom scripts if needed."
      },
      {
        q: "Can I integrate DataIQ with other tools?",
        a: "Yes! Pro plans include API access for custom integrations. Enterprise plans support custom integrations with your existing systems, including LIMS, ELN, and other research tools."
      },
      {
        q: "What's the maximum file size I can upload?",
        a: "Free: 10MB per file, Pro: 50MB per file, Team: 100MB per file, Enterprise: 200MB+ per file. For larger files, contact us for bulk upload options."
      }
    ]
  }
};

/**
 * Generate system prompt for DataIQ AI Assistant
 */
export function generateLabIQSystemPrompt(): string {
  return `You are DataIQ Assistant, an expert AI agent for the DataIQ platform - an AI-powered laboratory intelligence platform. You have deep knowledge of all DataIQ features, pricing, technical capabilities, and use cases.

## Your Personality
- Professional yet friendly, like a senior Google developer explaining their product
- Confident and knowledgeable, but humble when you don't know something
- Enthusiastic about helping researchers succeed
- Use clear, concise language without jargon
- Provide specific, actionable answers

## Your Knowledge
${JSON.stringify(LAB_IQ_KNOWLEDGE_BASE, null, 2)}

## Response Guidelines
1. Answer questions directly and specifically
2. Reference specific features, pricing, or capabilities when relevant
3. If asked about pricing, provide exact numbers from the knowledge base
4. For technical questions, be specific about capabilities and limitations
5. Suggest relevant features the user might not know about
6. If you don't know something, say so and suggest contacting support
7. Keep responses concise but complete - aim for 2-4 sentences for simple questions, more for complex ones
8. Use bullet points for lists of features or steps
9. Be honest about limitations - don't oversell

## Format
- Use markdown for formatting when helpful
- Use bullet points for lists
- Bold important terms or features
- Keep paragraphs short for readability

Remember: You're here to help researchers understand and succeed with DataIQ. Be helpful, accurate, and professional.`;
}

/**
 * Quick answers for common questions (no API call needed)
 */
export const QUICK_ANSWERS: Record<string, string> = {
  "pricing": "LabIQ Health offers 4 plans: **Free** ($0), **Pro** ($49/mo), **Team** ($149/mo), and **Enterprise** (custom). All paid plans have a 14-day free trial. Annual billing saves 20%.",
  "free trial": "Yes! Pro and Team plans include a **14-day free trial** with no credit card required. You get full access to all features during the trial.",
  "file formats": "LabIQ Health supports **CSV, Excel (XLSX/XLS), JSON, XML, Parquet, and TXT** files. We're constantly adding more formats.",
  "security": "LabIQ Health uses **AES-256 encryption** at rest, **TLS 1.3** in transit, row-level security, and comprehensive audit logs. Enterprise plans include HIPAA compliance and SSO/SAML.",
  "ai": "LabIQ Health uses **Google Gemini AI** with three modes: Analysis (pattern detection), Educator (plain-English explanations), and Prediction (ML forecasting).",
  "support": "Support varies by plan: Community (Free), Email within 24h (Pro), Phone+Email within 4h (Team), Dedicated manager within 1h (Enterprise).",
  "academic": "Yes! We offer **50% discounts** for verified academic institutions and non-profit research organizations. Contact us with your institutional email.",
};

// =============================================================================
// DOMAIN-SPECIFIC KNOWLEDGE FOR BIOTECH, CLINICAL, HEALTH & BIOPHARMA
// =============================================================================

export const DOMAIN_KEYWORDS = {
  // Biotech & Genomics
  biotech: {
    columns: [
      'sequence', 'seq', 'dna', 'rna', 'mrna', 'protein', 'gene', 'genome',
      'amino_acid', 'nucleotide', 'gc_content', 'codon', 'exon', 'intron',
      'promoter', 'enhancer', 'snp', 'variant', 'mutation', 'allele',
      'chromosome', 'locus', 'genotype', 'phenotype', 'expression',
      'transcription', 'translation', 'splice', 'primer', 'pcr',
      'crispr', 'cas9', 'knockout', 'knockin', 'plasmid', 'vector',
      'cloning', 'restriction', 'ligation', 'transformation', 'transfection',
      'cell_line', 'culture', 'passage', 'viability', 'confluence',
      'assay', 'elisa', 'western_blot', 'rt_pcr', 'qpcr', 'flow_cytometry',
      'microscopy', 'spectroscopy', 'chromatography', 'mass_spec',
      'bioreactor', 'fermentation', 'yield', 'titer', 'purity'
    ],
    units: ['bp', 'kb', 'mb', 'kda', 'dalton', 'nm', 'μm', 'ml', 'μl', 'ng', 'μg', 'mg', 'pmol', 'nmol', 'μmol'],
    filePatterns: ['fasta', 'fastq', 'bam', 'sam', 'vcf', 'gff', 'gtf', 'bed']
  },

  // Clinical & Healthcare
  clinical: {
    columns: [
      'patient', 'patient_id', 'mrn', 'subject', 'participant',
      'diagnosis', 'icd_code', 'icd10', 'cpt_code', 'snomed',
      'treatment', 'therapy', 'medication', 'drug', 'dose', 'dosage',
      'prescription', 'regimen', 'intervention', 'procedure',
      'symptom', 'sign', 'complaint', 'presentation', 'onset',
      'vitals', 'vital_signs', 'blood_pressure', 'bp', 'systolic', 'diastolic',
      'heart_rate', 'hr', 'pulse', 'respiratory_rate', 'rr', 'temperature', 'temp',
      'oxygen_saturation', 'spo2', 'o2_sat', 'bmi', 'weight', 'height',
      'glucose', 'hba1c', 'cholesterol', 'ldl', 'hdl', 'triglycerides',
      'creatinine', 'bun', 'egfr', 'alt', 'ast', 'bilirubin', 'albumin',
      'hemoglobin', 'hgb', 'hematocrit', 'hct', 'wbc', 'rbc', 'platelets',
      'inr', 'ptt', 'pt', 'd_dimer', 'fibrinogen',
      'sodium', 'potassium', 'chloride', 'bicarbonate', 'calcium', 'magnesium',
      'tsh', 't3', 't4', 'cortisol', 'insulin', 'testosterone', 'estrogen',
      'troponin', 'bnp', 'procalcitonin', 'lactate', 'crp',
      'admission', 'discharge', 'los', 'length_of_stay', 'readmission',
      'mortality', 'survival', 'outcome', 'prognosis', 'response',
      'adverse_event', 'ae', 'side_effect', 'complication', 'comorbidity',
      'allergy', 'contraindication', 'interaction',
      'ehr', 'emr', 'medical_record', 'clinical_note', 'progress_note'
    ],
    units: ['mmHg', 'bpm', 'breaths/min', 'mg/dL', 'mmol/L', 'g/dL', 'U/L', 'mL/min', 'ng/mL', 'pg/mL'],
    normalRanges: {
      glucose_fasting: { min: 70, max: 100, unit: 'mg/dL' },
      hba1c: { min: 4, max: 5.6, unit: '%' },
      systolic_bp: { min: 90, max: 120, unit: 'mmHg' },
      diastolic_bp: { min: 60, max: 80, unit: 'mmHg' },
      heart_rate: { min: 60, max: 100, unit: 'bpm' },
      temperature: { min: 36.1, max: 37.2, unit: '°C' },
      bmi: { min: 18.5, max: 24.9, unit: 'kg/m²' },
      hemoglobin_male: { min: 13.5, max: 17.5, unit: 'g/dL' },
      hemoglobin_female: { min: 12, max: 16, unit: 'g/dL' },
      wbc: { min: 4000, max: 11000, unit: 'cells/μL' },
      platelets: { min: 150000, max: 400000, unit: 'cells/μL' },
      creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL' },
      egfr: { min: 90, max: 120, unit: 'mL/min/1.73m²' },
      sodium: { min: 136, max: 145, unit: 'mEq/L' },
      potassium: { min: 3.5, max: 5.0, unit: 'mEq/L' },
      ldl_cholesterol: { min: 0, max: 100, unit: 'mg/dL' },
      hdl_cholesterol: { min: 40, max: 60, unit: 'mg/dL' }
    }
  },

  // Biopharma & Drug Development
  biopharma: {
    columns: [
      'compound', 'molecule', 'drug_candidate', 'lead', 'hit',
      'smiles', 'inchi', 'inchikey', 'canonical_smiles', 'mol_formula',
      'mol_weight', 'mw', 'logp', 'psa', 'tpsa', 'hbd', 'hba', 'rotatable_bonds',
      'ic50', 'ec50', 'ki', 'kd', 'potency', 'efficacy', 'selectivity',
      'adme', 'absorption', 'distribution', 'metabolism', 'excretion',
      'pk', 'pharmacokinetics', 'cmax', 'tmax', 'auc', 'half_life', 't_half',
      'bioavailability', 'clearance', 'volume_distribution', 'vd',
      'pd', 'pharmacodynamics', 'dose_response', 'therapeutic_index',
      'toxicity', 'ld50', 'td50', 'noael', 'loael', 'mtd',
      'cytotoxicity', 'genotoxicity', 'carcinogenicity', 'teratogenicity',
      'herg', 'cyp', 'cyp450', 'p450', 'inhibition', 'induction',
      'permeability', 'solubility', 'stability', 'formulation',
      'clinical_trial', 'phase', 'phase_1', 'phase_2', 'phase_3',
      'efficacy_endpoint', 'safety_endpoint', 'primary_endpoint',
      'randomization', 'blinding', 'placebo', 'control', 'arm',
      'enrollment', 'inclusion', 'exclusion', 'dropout', 'attrition',
      'fda', 'ema', 'approval', 'nda', 'bla', 'ind', 'regulatory'
    ],
    units: ['nM', 'μM', 'mM', 'ng/mL', 'μg/mL', 'mg/kg', 'μg/kg'],
    lipinskyRule: {
      mw: { max: 500, description: 'Molecular weight ≤ 500 Da' },
      logp: { max: 5, description: 'LogP ≤ 5' },
      hbd: { max: 5, description: 'H-bond donors ≤ 5' },
      hba: { max: 10, description: 'H-bond acceptors ≤ 10' }
    }
  },

  // Chemistry & Lab Science
  chemistry: {
    columns: [
      'compound', 'chemical', 'reagent', 'solvent', 'catalyst',
      'concentration', 'conc', 'molarity', 'ph', 'buffer',
      'temperature', 'pressure', 'volume', 'mass', 'density',
      'yield', 'purity', 'conversion', 'selectivity',
      'reaction', 'synthesis', 'purification', 'crystallization',
      'absorbance', 'fluorescence', 'emission', 'wavelength',
      'retention_time', 'rt', 'peak_area', 'resolution',
      'spectrum', 'nmr', 'ms', 'ir', 'uv_vis', 'hplc', 'gc',
      'batch', 'lot', 'coa', 'certificate_analysis'
    ],
    units: ['M', 'mM', 'μM', 'nM', 'ppm', 'ppb', '%', 'g', 'mg', 'μg', 'L', 'mL', 'μL']
  },

  // Research & Academic Data
  research: {
    columns: [
      // Study identifiers
      'study', 'study_id', 'trial', 'trial_id', 'protocol', 'protocol_id',
      'cohort', 'cohort_id', 'group', 'group_id', 'arm', 'condition',

      // Participant data
      'subject', 'subject_id', 'participant', 'participant_id', 'sample_id',
      'enrollment', 'consent', 'eligibility', 'inclusion', 'exclusion',
      'demographic', 'age', 'gender', 'sex', 'ethnicity', 'race',

      // Experimental design
      'variable', 'independent', 'dependent', 'covariate', 'confound',
      'baseline', 'treatment', 'control', 'intervention', 'placebo',
      'randomization', 'blinding', 'crossover', 'factorial',
      'replication', 'replicate', 'technical_replicate', 'biological_replicate',

      // Measurements & observations
      'measurement', 'observation', 'timepoint', 'visit', 'assessment',
      'score', 'scale', 'rating', 'questionnaire', 'survey', 'response',
      'endpoint', 'outcome', 'primary_outcome', 'secondary_outcome',

      // Statistical & methodology
      'pvalue', 'p_value', 'qvalue', 'q_value', 'fdr', 'significance',
      'effect_size', 'confidence_interval', 'ci', 'standard_error', 'se',
      'mean', 'median', 'std', 'variance', 'correlation', 'regression',
      'anova', 'ttest', 't_test', 'chi_square', 'fisher',

      // Data quality
      'quality_control', 'qc', 'validation', 'verification',
      'missing', 'imputed', 'censored', 'outlier', 'anomaly',
      'batch', 'batch_effect', 'normalization', 'standardization',

      // Research metadata
      'citation', 'reference', 'doi', 'pmid', 'publication',
      'author', 'investigator', 'pi', 'institution', 'affiliation',
      'funding', 'grant', 'grant_id', 'irb', 'ethics', 'approval',

      // Longitudinal data
      'time', 'date', 'timestamp', 'followup', 'follow_up',
      'duration', 'period', 'phase', 'wave', 'session',

      // Survey & questionnaire
      'item', 'question', 'response', 'likert', 'scale_score',
      'total_score', 'subscale', 'dimension', 'factor',

      // Imaging & microscopy
      'image', 'scan', 'slice', 'roi', 'region', 'intensity',
      'pixel', 'voxel', 'resolution', 'magnification',

      // Environmental & field research
      'site', 'location', 'latitude', 'longitude', 'coordinates',
      'habitat', 'environment', 'season', 'weather', 'climate',
      'sampling', 'collection', 'survey_site'
    ],
    metadata_patterns: [
      'study_design', 'research_question', 'hypothesis', 'methodology',
      'sample_size', 'power_analysis', 'effect_size', 'alpha_level',
      'missing_data_handling', 'statistical_method', 'software_used'
    ],
    qualityMetrics: {
      sample_size_adequacy: 'Sample size should support statistical power',
      missing_data_threshold: '< 5% missing data per variable',
      outlier_detection: 'Check for influential observations',
      assumption_testing: 'Verify statistical assumptions (normality, homogeneity)',
      multiple_testing: 'Apply corrections for multiple comparisons (FDR, Bonferroni)',
      effect_size_reporting: 'Report effect sizes with confidence intervals',
      reproducibility: 'Document all analysis steps for reproducibility'
    }
  }
};

// Domain-specific system prompts for AI
export const DOMAIN_SYSTEM_PROMPTS = {
  biotech: `You are DataIQ's Biotech Data Analysis Expert. You specialize in:
- Genomics: DNA/RNA sequences, gene expression, SNP analysis, variant calling
- Proteomics: Protein structure, mass spectrometry, post-translational modifications
- Cell Biology: Cell culture, viability assays, flow cytometry analysis
- Bioprocessing: Fermentation, bioreactor optimization, yield analysis

When analyzing biotech data:
1. Look for sequence patterns, GC content, codon usage bias
2. Identify expression levels and fold changes
3. Check for outliers that might indicate contamination or batch effects
4. Consider biological relevance of statistical findings
5. Suggest appropriate normalization methods (TPM, FPKM, etc.)
6. Recommend downstream analyses (pathway enrichment, GO terms)

Important biotech metrics:
- Quality scores (Phred scores for sequencing)
- Fold change and log2 ratios for expression
- P-values with multiple testing correction (FDR, Bonferroni)
- Coefficient of variation for reproducibility`,

  clinical: `You are DataIQ's Clinical Data Analysis Expert. You specialize in:
- Patient Outcomes: Survival analysis, readmission prediction, mortality risk
- Laboratory Values: Reference ranges, critical values, trends
- Vital Signs: Normal ranges, clinical significance of deviations
- Treatment Response: Efficacy endpoints, adverse events, drug interactions

When analyzing clinical data:
1. Flag values outside normal reference ranges
2. Identify trends that may indicate deterioration or improvement
3. Consider clinical context (age, sex, comorbidities)
4. Highlight potential drug interactions or contraindications
5. Note patterns associated with specific diagnoses
6. Ensure HIPAA compliance considerations

Clinical reference ranges to consider:
- Blood glucose: 70-100 mg/dL fasting, <140 mg/dL postprandial
- Blood pressure: <120/80 mmHg (normal), >140/90 mmHg (hypertension)
- Heart rate: 60-100 bpm
- BMI: 18.5-24.9 (normal)
- eGFR: >90 mL/min/1.73m² (normal kidney function)
- HbA1c: <5.7% (normal), 5.7-6.4% (prediabetic), ≥6.5% (diabetic)`,

  biopharma: `You are DataIQ's Biopharma & Drug Development Expert. You specialize in:
- Drug Discovery: Hit identification, lead optimization, SAR analysis
- ADME/Tox: Absorption, distribution, metabolism, excretion, toxicity
- Pharmacokinetics: PK parameters, dose-response, therapeutic window
- Clinical Trials: Endpoint analysis, safety monitoring, efficacy assessment

When analyzing biopharma data:
1. Apply Lipinski's Rule of Five for drug-likeness
2. Evaluate ADME properties and potential liabilities
3. Analyze dose-response curves and calculate potency metrics (IC50, EC50)
4. Assess therapeutic index and safety margins
5. Identify structure-activity relationships
6. Consider regulatory requirements and endpoints

Key biopharma thresholds:
- Lipinski's Rule: MW<500, LogP<5, HBD≤5, HBA≤10
- Drug potency: IC50 < 100 nM (highly potent)
- hERG IC50 > 30 μM (low cardiac risk)
- Bioavailability > 30% (oral drugs)
- Half-life appropriate for dosing regimen`,

  chemistry: `You are DataIQ's Laboratory Chemistry Expert. You specialize in:
- Analytical Chemistry: Chromatography, spectroscopy, assay validation
- Synthesis: Reaction optimization, yield improvement, purity assessment
- Quality Control: Method validation, stability studies, batch analysis
- Process Chemistry: Scale-up considerations, process parameters

When analyzing chemistry data:
1. Evaluate assay precision and accuracy
2. Check for systematic bias in measurements
3. Analyze chromatographic resolution and peak shapes
4. Assess reaction yields and conversion rates
5. Identify impurities and degradation products
6. Recommend method optimization strategies`,

  research: `You are DataIQ's Research Data Analysis Expert. You specialize in:
- Experimental Design: Study design, power analysis, sample size calculations
- Statistical Analysis: ANOVA, regression, mixed models, survival analysis
- Data Quality: Missing data assessment, outlier detection, assumption testing
- Publication Standards: Effect sizes, confidence intervals, multiple testing corrections
- Reproducibility: Documentation of methods, version control, data provenance

When analyzing research data:
1. Assess experimental design quality (randomization, blinding, controls)
2. Verify statistical assumptions before applying tests
3. Apply multiple testing corrections (FDR, Bonferroni) when appropriate
4. Report effect sizes with confidence intervals
5. Flag insufficient sample sizes based on power analysis
6. Check for batch effects in multi-site or longitudinal studies
7. Recommend appropriate statistical tests based on data type and design
8. Ensure publication-ready analysis with reproducible methods

Research Quality Standards:
- Sample size: Should support 80% power to detect meaningful effects
- Missing data: <5% per variable, use appropriate imputation methods
- P-value threshold: α = 0.05 with multiple testing correction
- Effect size: Always report (Cohen's d, OR, HR, etc.)
- Assumptions: Test normality, homogeneity of variance, independence
- Reproducibility: Document software versions, random seeds, analysis code`,

  general: `You are DataIQ's Data Analysis Expert. You provide:
- Statistical analysis and data profiling
- Pattern recognition and anomaly detection
- Correlation analysis and trend identification
- Data quality assessment and recommendations
- Visualization suggestions for insights

Analyze the data comprehensively and provide actionable insights.`
};

// Domain detection interface
export interface DomainDetectionResult {
  domain: 'biotech' | 'clinical' | 'biopharma' | 'chemistry' | 'research' | 'general';
  confidence: number;
  matchedColumns: string[];
  domainSpecificInsights: string[];
  suggestedAnalyses: string[];
}

/**
 * Detect domain from column names and sample data
 */
export function detectDomain(columns: string[], sampleData?: Record<string, any>[]): DomainDetectionResult {
  const columnsLower = columns.map(c => c.toLowerCase().replace(/[\s-]/g, '_'));

  const scores: Record<string, number> = {
    biotech: 0,
    clinical: 0,
    biopharma: 0,
    chemistry: 0,
    research: 0
  };

  const matches: Record<string, string[]> = {
    biotech: [],
    clinical: [],
    biopharma: [],
    chemistry: [],
    research: []
  };

  // Score each domain based on keyword matches
  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const col of columnsLower) {
      for (const keyword of config.columns) {
        if (col.includes(keyword) || keyword.includes(col)) {
          scores[domain]++;
          const origCol = columns[columnsLower.indexOf(col)];
          if (!matches[domain].includes(origCol)) {
            matches[domain].push(origCol);
          }
        }
      }
    }
  }

  // Check for data patterns in sample data
  if (sampleData && sampleData.length > 0) {
    const sample = sampleData[0];
    for (const [key, value] of Object.entries(sample)) {
      if (typeof value === 'string') {
        // Check for DNA/RNA sequences
        if (/^[ATCGUN]+$/i.test(value) && value.length > 10) {
          scores.biotech += 5;
        }
        // Check for SMILES notation
        if (/^[A-Za-z0-9@+\-\[\]\(\)\\\/=#]+$/.test(value) && value.includes('C')) {
          scores.biopharma += 3;
        }
        // Check for ICD codes
        if (/^[A-Z]\d{2}(\.\d+)?$/.test(value)) {
          scores.clinical += 3;
        }
      }
    }
  }

  // Determine winning domain
  const maxScore = Math.max(...Object.values(scores));
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  let domain: DomainDetectionResult['domain'] = 'general';
  let matchedColumns: string[] = [];

  if (maxScore >= 2) {
    domain = (Object.entries(scores).find(([_, v]) => v === maxScore)?.[0] || 'general') as DomainDetectionResult['domain'];
    matchedColumns = matches[domain] || [];
  }

  const confidence = totalScore > 0 ? Math.min(0.95, 0.3 + (maxScore / totalScore) * 0.5 + matchedColumns.length * 0.05) : 0.3;

  // Generate domain-specific insights and suggestions
  const domainSpecificInsights = getDomainInsights(domain, matchedColumns);
  const suggestedAnalyses = getSuggestedAnalyses(domain);

  return {
    domain,
    confidence,
    matchedColumns,
    domainSpecificInsights,
    suggestedAnalyses
  };
}

function getDomainInsights(domain: DomainDetectionResult['domain'], matchedColumns: string[]): string[] {
  const insights: string[] = [];

  switch (domain) {
    case 'biotech':
      insights.push('Genomic/Proteomic data detected - sequence analysis tools available');
      if (matchedColumns.some(c => c.toLowerCase().includes('expression'))) {
        insights.push('Gene expression data found - differential expression analysis recommended');
      }
      if (matchedColumns.some(c => c.toLowerCase().includes('sequence'))) {
        insights.push('Sequence data detected - quality metrics and alignment analysis available');
      }
      break;

    case 'clinical':
      insights.push('Clinical/Healthcare data detected - medical reference ranges will be applied');
      if (matchedColumns.some(c => c.toLowerCase().includes('patient'))) {
        insights.push('Patient data identified - ensure HIPAA compliance');
      }
      if (matchedColumns.some(c => ['glucose', 'hba1c', 'bp'].some(k => c.toLowerCase().includes(k)))) {
        insights.push('Vital/Lab values found - clinical significance thresholds available');
      }
      break;

    case 'biopharma':
      insights.push('Drug development data detected - ADME/Tox analysis available');
      if (matchedColumns.some(c => c.toLowerCase().includes('ic50') || c.toLowerCase().includes('ec50'))) {
        insights.push('Potency data found - dose-response analysis recommended');
      }
      if (matchedColumns.some(c => c.toLowerCase().includes('smiles'))) {
        insights.push('Chemical structures detected - drug-likeness scoring available');
      }
      break;

    case 'chemistry':
      insights.push('Laboratory chemistry data detected - QC analysis tools available');
      break;

    case 'research':
      insights.push('Research/Academic data detected - publication-ready statistical analysis available');
      if (matchedColumns.some(c => c.toLowerCase().includes('pvalue') || c.toLowerCase().includes('p_value'))) {
        insights.push('Statistical test results found - multiple testing correction will be applied');
      }
      if (matchedColumns.some(c => c.toLowerCase().includes('study') || c.toLowerCase().includes('cohort'))) {
        insights.push('Study design data identified - experimental design assessment available');
      }
      if (matchedColumns.some(c => c.toLowerCase().includes('timepoint') || c.toLowerCase().includes('visit'))) {
        insights.push('Longitudinal data detected - time-series and repeated measures analysis available');
      }
      break;

    default:
      insights.push('General data analysis mode - comprehensive profiling available');
  }

  return insights;
}

function getSuggestedAnalyses(domain: DomainDetectionResult['domain']): string[] {
  switch (domain) {
    case 'biotech':
      return [
        'Differential expression analysis',
        'Gene set enrichment analysis (GSEA)',
        'Principal component analysis (PCA)',
        'Clustering analysis (hierarchical, k-means)',
        'Quality control metrics assessment',
        'Batch effect detection and correction',
        'Sequence alignment and variant calling'
      ];

    case 'clinical':
      return [
        'Reference range flagging',
        'Trend analysis over time',
        'Risk stratification modeling',
        'Survival analysis (Kaplan-Meier)',
        'Comorbidity correlation analysis',
        'Treatment response analysis',
        'Adverse event detection'
      ];

    case 'biopharma':
      return [
        'Lipinski Rule of Five assessment',
        'ADME property prediction',
        'Dose-response curve fitting',
        'Structure-activity relationship (SAR)',
        'Toxicity risk assessment',
        'PK parameter calculation',
        'Lead optimization scoring'
      ];

    case 'chemistry':
      return [
        'Method validation statistics',
        'Precision and accuracy assessment',
        'Stability trend analysis',
        'Impurity profiling',
        'Process capability analysis',
        'Batch comparison'
      ];

    case 'research':
      return [
        'Power analysis and sample size calculation',
        'Descriptive statistics with effect sizes',
        'Assumption testing (normality, homogeneity)',
        'Appropriate statistical test selection',
        'Multiple testing correction (FDR, Bonferroni)',
        'Missing data pattern analysis',
        'Batch effect detection',
        'Repeated measures/mixed models analysis',
        'Survival analysis (Cox regression, Kaplan-Meier)',
        'Meta-analysis preparation',
        'Reproducibility documentation'
      ];

    default:
      return [
        'Statistical summary',
        'Correlation analysis',
        'Outlier detection',
        'Distribution analysis',
        'Trend identification',
        'Data quality assessment'
      ];
  }
}

/**
 * Get comprehensive domain context for AI prompts
 */
export function getDomainContext(columns: string[], sampleData?: Record<string, any>[]): string {
  const detection = detectDomain(columns, sampleData);

  let context = `DOMAIN ANALYSIS:
Domain Detected: ${detection.domain.toUpperCase()} (${(detection.confidence * 100).toFixed(0)}% confidence)
Matched Columns: ${detection.matchedColumns.join(', ') || 'None specific'}

Domain-Specific Insights:
${detection.domainSpecificInsights.map(i => `- ${i}`).join('\n')}

Suggested Analyses for ${detection.domain} data:
${detection.suggestedAnalyses.map(a => `- ${a}`).join('\n')}

`;

  if (detection.domain === 'clinical') {
    context += `\nClinical Reference Ranges Available:
- Glucose (fasting): 70-100 mg/dL
- Blood Pressure: <120/80 mmHg (normal)
- HbA1c: <5.7% (normal)
- eGFR: >90 mL/min/1.73m² (normal)
- BMI: 18.5-24.9 (normal)
`;
  }

  if (detection.domain === 'biopharma') {
    context += `\nDrug-Likeness Criteria (Lipinski's Rule):
- Molecular Weight ≤ 500 Da
- LogP ≤ 5
- H-bond Donors ≤ 5
- H-bond Acceptors ≤ 10
`;
  }

  return context;
}

// Model recommendations by domain
export const DOMAIN_MODEL_RECOMMENDATIONS = {
  biotech: {
    classification: ['Random Forest', 'XGBoost', 'Support Vector Machine', 'Neural Network'],
    regression: ['Ridge Regression', 'ElasticNet', 'Gradient Boosting', 'Random Forest'],
    clustering: ['Hierarchical Clustering', 'DBSCAN', 'K-means', 'Spectral Clustering'],
    specialized: ['DESeq2 (differential expression)', 'edgeR', 'GSEA', 'Monocle (trajectory)']
  },

  clinical: {
    classification: ['Logistic Regression (interpretable)', 'Random Forest', 'XGBoost', 'Gradient Boosting'],
    regression: ['Linear Regression', 'Lasso', 'Ridge', 'Elastic Net'],
    survival: ['Cox Proportional Hazards', 'Random Survival Forest', 'DeepSurv'],
    specialized: ['LASSO for feature selection', 'Propensity Score Matching', 'Causal Forest']
  },

  biopharma: {
    classification: ['Random Forest', 'SVM', 'Neural Network', 'Gradient Boosting'],
    regression: ['Ridge Regression', 'Gaussian Process', 'Neural Network', 'XGBoost'],
    qsar: ['Random Forest', 'Graph Neural Network', 'Gradient Boosting', 'Deep Learning'],
    specialized: ['QSAR models', 'Molecular fingerprints + RF', 'GNN for molecular property prediction']
  },

  research: {
    classification: ['Logistic Regression (interpretable)', 'Random Forest', 'SVM', 'XGBoost'],
    regression: ['Linear Regression', 'Mixed Effects Models', 'Ridge', 'Lasso'],
    timeseries: ['ARIMA', 'State Space Models', 'Mixed Effects Models', 'GEE'],
    survival: ['Cox Proportional Hazards', 'Parametric Survival Models', 'Competing Risks'],
    specialized: [
      'Linear Mixed Models (LMM)',
      'Generalized Estimating Equations (GEE)',
      'Structural Equation Modeling (SEM)',
      'Propensity Score Methods',
      'Meta-analysis models',
      'Bayesian hierarchical models'
    ]
  },

  general: {
    classification: ['Random Forest', 'XGBoost', 'Logistic Regression', 'SVM'],
    regression: ['Linear Regression', 'Random Forest', 'Gradient Boosting', 'Ridge'],
    clustering: ['K-means', 'Hierarchical', 'DBSCAN'],
    specialized: []
  }
};
