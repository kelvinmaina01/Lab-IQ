# LabIQ Health V1 Implementation Plan

> **An Automation-First Health Data Intelligence Platform**  
> "*Upload health data. We handle the science.*"

---

## 🏗️ ARCHITECTURE VALIDATION CHECKLIST

Before each phase, validate alignment with The Automation Trinity + Orchestrator architecture:

### Core Architecture Principles
- [ ] **Workflow Engine is Control Plane** - All automation flows through workflows first
- [ ] **AI Assistant is Cognitive Plane** - LabAI recommends, workflows execute
- [ ] **Experiments are State Plane** - Scientific intent tracked with state machine
- [ ] **Models are Execution Plane** - Emit signals, not conclusions

### The Closed Loop (Critical Validation)
```
DATA → EXPERIMENT → MODEL → SIGNAL → AI INTERPRETATION → WORKFLOW ACTION → (back to DATA)
```

---

## 📊 EXISTING CODEBASE VS PLANNED FEATURES - COMPREHENSIVE GAP ANALYSIS

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully Implemented |
| 🔶 | Partially Implemented (Needs Enhancement) |
| ❌ | Not Implemented (Build Required) |
| 🔄 | Needs Refactoring |

---

## PHASE 1: DATA SOURCES & INGESTION

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| CSV Upload | ✅ | `src/lib/parsers/csvParser.ts` (7KB) | Full implementation |
| Excel Upload | ✅ | `src/lib/parsers/excelParser.ts` (5.5KB) | Full implementation |
| JSON Upload | ✅ | `src/lib/parsers/jsonParser.ts` (5KB) | Full implementation |
| XML Upload | ❌ | - | Not implemented |
| Parser Types | ✅ | `src/lib/parsers/types.ts` (3KB) | ParsedData, ColumnInfo, QualityMetrics |
| Dataset Save | ✅ | `src/lib/services/datasetService.ts` (9.5KB) | Saves to Supabase |
| Quality Analysis | ✅ | `src/lib/analysis/qualityAnalyzer.ts` | Quality metrics |
| Cloud Sources UI | 🔶 | `src/components/ConnectDataSources.tsx` (17KB) | UI only, no OAuth |
| Device Data | 🔶 | `src/lib/services/deviceDataService.ts` (11.7KB) | Partial implementation |
| Advanced Ingestion | ❌ | - | No enhanced pipeline |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/ingestionService.ts`
- [ ] Create IngestionService class
- [ ] Add schema auto-detection for all formats
- [ ] Add unit normalization (ISO standards: kg, bpm, mmHg)
- [ ] Add timestamp alignment (UTC/ISO 8601)
- [ ] Integrate with anonymization pipeline
- [ ] Emit DATASET_UPLOADED event on completion

#### [NEW] `src/lib/parsers/xmlParser.ts`
- [ ] Create XML parser with SAX-based parsing
- [ ] Support health data XML formats
- [ ] Integrate with ParsedData types

#### [NEW] `src/lib/services/cloudSourceService.ts`
- [ ] Google Drive OAuth integration
- [ ] Dropbox OAuth integration
- [ ] AWS S3 credentials-based access
- [ ] OneDrive OAuth integration
- [ ] Scheduled sync mechanism

#### [NEW] `src/lib/services/anonymizationService.ts`
- [ ] PHI pattern detection (names, emails, SSN, device IDs)
- [ ] SHA-256 identifier hashing
- [ ] DOB to age bracket conversion
- [ ] Anonymization report generation
- [ ] HIPAA Safe Harbor compliance check

#### [MODIFY] `src/lib/services/datasetService.ts`
- [ ] Add event emission on save
- [ ] Add domain classification hook
- [ ] Add provenance tracking
- [ ] Add versioning support

---

## PHASE 2: DATASETS SYSTEM

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Dataset CRUD | ✅ | `src/lib/services/datasetService.ts` | Full CRUD operations |
| Dataset Page | ✅ | `src/pages/Datasets.tsx` (17.6KB) | List and upload |
| Dataset Detail | ✅ | `src/pages/DatasetDetail.tsx` (35KB) | Full detail view |
| Column Info | ✅ | Database migration exists | dataset_columns table |
| Quality Metrics | ✅ | Database migration exists | quality_metrics table |
| Versioning | ❌ | - | Not implemented |
| Provenance | ❌ | - | Not implemented |
| Domain Classification | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `supabase/migrations/20251223_datasets_v2.sql`
- [ ] Add `version` column (INTEGER DEFAULT 1)
- [ ] Add `parent_version_id` column (UUID FK)
- [ ] Add `provenance` column (JSONB)
- [ ] Add `domain` column (ENUM: health, clinical, biopharma, environmental, population)
- [ ] Add `domain_confidence` column (DECIMAL)
- [ ] Add `is_anonymized` column (BOOLEAN)
- [ ] Add `phi_fields_masked` column (TEXT[])
- [ ] Add `anonymization_log` column (JSONB)

#### [MODIFY] `src/pages/Datasets.tsx`
- [ ] Add cloud source connection UI
- [ ] Add device sync configuration
- [ ] Display domain classification badges
- [ ] Show anonymization status indicator
- [ ] Add provenance tracking view

---

## PHASE 3: WORKFLOW ENGINE (THE BRAIN) ⚡ CRITICAL

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Workflow CRUD | ✅ | `src/lib/services/workflowService.ts` (50KB, 1550 lines) | Full service |
| Workflow Types | ✅ | WorkflowStep, Workflow, WorkflowExecution, WorkflowInsight | Defined |
| Trigger Types | ✅ | dataset_upload, manual, schedule, threshold, event, device_stream, webhook | All defined |
| Step Execution | ✅ | `executeStep()` method | quality_check, transform, train_model, analyze, notify, export |
| Execution History | ✅ | `fetchExecutions()` | Tracks runs |
| Insights | ✅ | `WorkflowInsight`, `createInsight()` | Severity-based |
| Reports | ✅ | `WorkflowReport`, `generateReport()` | Multiple formats |
| Event Bus | ❌ | - | Not implemented |
| Rules Engine | ❌ | - | Not implemented |
| LangChain/LangGraph | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/eventBus.ts` ⚡ CRITICAL
- [ ] Create EventBus singleton class
- [ ] Define all event types:
  - [ ] DATASET_UPLOADED
  - [ ] DATASET_UPDATED
  - [ ] EXPERIMENT_CREATED
  - [ ] EXPERIMENT_RUNNING
  - [ ] EXPERIMENT_COMPLETED
  - [ ] MODEL_TRAINING_STARTED
  - [ ] MODEL_TRAINING_COMPLETED
  - [ ] ANOMALY_DETECTED
  - [ ] AI_INSIGHT_GENERATED
  - [ ] REPORT_GENERATED
  - [ ] THRESHOLD_EXCEEDED
- [ ] Implement emit/on/off methods
- [ ] Create HealthEvent interface with payload, timestamp, source, metadata

#### [NEW] `src/lib/services/rulesEngine.ts` ⚡ CRITICAL
- [ ] Create Rule interface (id, name, trigger, conditions, actions, priority, isActive)
- [ ] Create Condition interface (field, operator, value)
- [ ] Create Action interface (type, config)
- [ ] Implement condition evaluator (equals, contains, greaterThan, lessThan, in, matches)
- [ ] Implement action executor
- [ ] Add 5 canonical rules:
  - [ ] Rule 1: dataset-to-experiment (DATASET_UPLOADED → CREATE_EXPERIMENT)
  - [ ] Rule 2: experiment-to-model (EXPERIMENT_RUNNING → TRIGGER_AUTOML)
  - [ ] Rule 3: model-to-ai (MODEL_TRAINING_COMPLETED → REQUEST_AI_INTERPRETATION)
  - [ ] Rule 4: ai-escalation (AI_INSIGHT_GENERATED + high confidence → NOTIFY_TEAM)
  - [ ] Rule 5: experiment-to-report (EXPERIMENT_COMPLETED → GENERATE_REPORT)

#### [MODIFY] `src/lib/services/workflowService.ts`
- [ ] Integrate EventBus listener
- [ ] Connect to Rules Engine for evaluation
- [ ] Add AI reasoning hook via LabAI
- [ ] Implement automatic experiment creation action
- [ ] Add automatic model training trigger

---

## PHASE 4: EXPERIMENTS SYSTEM

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Experiments Page | ✅ | `src/pages/Experiments.tsx` (589 lines) | Full UI |
| Experiment CRUD | ✅ | Database migration exists | experiments table |
| Dataset Link | ✅ | 20251202_experiments_dataset_link.sql | FK to datasets |
| Status Field | 🔶 | Basic statuses | Needs state machine |
| Templates | ✅ | `src/components/experiments/ExperimentTemplates.tsx` | Template selection |
| AI Proposals | ❌ | - | Not implemented |
| Protocol Tracking | ❌ | - | Not implemented |
| State Machine | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `supabase/migrations/20251223_experiments_v2.sql`
- [ ] Add `status` ENUM (PLANNED, RUNNING, COMPLETED, FAILED)
- [ ] Add `started_at` TIMESTAMPTZ
- [ ] Add `completed_at` TIMESTAMPTZ
- [ ] Add `objective` TEXT
- [ ] Add `hypothesis` TEXT
- [ ] Add `success_metrics` JSONB
- [ ] Add `protocol_steps` JSONB
- [ ] Add `allowed_models` TEXT[]
- [ ] Add `results` JSONB
- [ ] Create `experiment_proposals` table for AI proposals

#### [NEW] `src/lib/services/experimentService.ts`
- [ ] Create ExperimentService class
- [ ] `createFromDataset()` - auto-create from dataset upload
- [ ] `updateStatus()` - state machine transitions
- [ ] `attachDataset()` - link datasets
- [ ] `linkModel()` - link trained models
- [ ] `recordResults()` - store results
- [ ] `getProposedExperiments()` - AI proposals for dataset

#### [MODIFY] `src/pages/Experiments.tsx`
- [ ] Add state machine visualization (PLANNED → RUNNING → COMPLETED → FAILED)
- [ ] Add AI-proposed experiments section
- [ ] Display linked datasets
- [ ] Show protocol/method tracking
- [ ] Mobile-responsive cards

---

## PHASE 5: AI ASSISTANT (LabAI) 🧠 CRITICAL

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| LabIQAI Class | ✅ | `src/lib/ai/LabIQAI.ts` (1471 lines, 47KB) | Multi-agent system |
| Multi-Provider | ✅ | Anthropic, GROQ, Gemini, OpenAI | Provider fallback |
| Analysis Mode | ✅ | DataAnalysisAgent | Data exploration |
| ML Mode | 🔶 | MLPipelineAgent | Needs enhancement |
| Learn Mode | ❌ | - | Not implemented |
| AI Chat Component | ✅ | `src/components/AIAssistantChat.tsx` (16.5KB) | Chat UI |
| Assistant Page | ✅ | `src/pages/Assistant.tsx` (11.4KB) | Full page |
| Mode Selection | 🔶 | analysis, automl, educator | Needs 3-mode spec |
| Insight Agent | ✅ | InsightAgent | Predictive insights |
| Thought Process | ✅ | ThoughtStep interface | Explainability |
| Safety Filter | ❌ | - | Not implemented |
| Chart Generation | 🔶 | ChartData | Needs validation |
| Workflow Integration | ❌ | - | Not connected to events |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/labAIService.ts` ⚡ CRITICAL
- [ ] Create LabAIService class (wrapper around existing LabIQAI)
- [ ] Implement 3-mode selection:
  - [ ] ANALYST mode (🧠) - What is happening in the data?
  - [ ] ML mode (🤖) - What did the model do, and why?
  - [ ] LEARN mode (📘) - What does this mean in real-world health terms?
- [ ] Add GROQ + Gemini orchestration with routing logic
- [ ] `classifyDataset()` - domain classification
- [ ] `interpretResults()` - model result interpretation
- [ ] `proposeExperiment()` - experiment proposals
- [ ] `recommendModels()` - model recommendations
- [ ] `explainAnomaly()` - anomaly explanation
- [ ] `assessEscalation()` - human intervention decision

#### [NEW] `src/lib/services/safetyFilter.ts`
- [ ] Clinical advice detection
- [ ] Definitive claims detection
- [ ] Disclaimer injection
- [ ] Response sanitization
- [ ] Confidence threshold enforcement
- [ ] Population-level language enforcement

#### [NEW] `src/lib/services/aiOrchestrator.ts`
- [ ] GROQ routing (fast summaries, graph descriptions)
- [ ] Gemini routing (deep reasoning, education, Learn mode)
- [ ] Provider switching based on task type
- [ ] Response formatting with explainability panel

#### [NEW] `src/components/ai/ExplainabilityPanel.tsx`
- [ ] Findings display
- [ ] Evidence citation (dataset version, coverage)
- [ ] Confidence score visualization
- [ ] Limitations disclosure

#### [NEW] `src/components/ai/ModeSelector.tsx`
- [ ] 3-mode toggle (Analyst/ML/Learn)
- [ ] Mode icons and descriptions
- [ ] Mobile-friendly design

#### [MODIFY] `src/components/AIAssistantChat.tsx`
- [ ] Integrate 3-mode system
- [ ] Add ExplainabilityPanel
- [ ] Connect to EventBus for workflow triggers
- [ ] Add safety filter integration

#### [NEW] `ml-service/agents/labai_agent.py`
- [ ] Create LabAIAgent class with LangChain
- [ ] `classify_domain()` method
- [ ] `propose_experiment()` method
- [ ] `interpret_results()` method
- [ ] `assess_escalation()` method
- [ ] Connect to Ollama for local inference

---

## PHASE 6: ML MODELS & AutoML

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Models Page | ✅ | `src/pages/Models.tsx` (1406 lines, 54KB) | Full UI |
| ML Orchestrator | ✅ | `ml-service/agents/orchestrator.py` (253 lines) | Multi-agent AutoML |
| Data Agent | ✅ | `ml-service/agents/data_agent.py` (10.8KB) | Data preprocessing |
| Feature Agent | ✅ | `ml-service/agents/feature_agent.py` (14.5KB) | Feature engineering |
| Model Selection | ✅ | `ml-service/agents/model_selection_agent.py` (19.7KB) | Algorithm selection |
| Hyperparameter | ✅ | `ml-service/agents/hyperparameter_agent.py` (8.8KB) | Tuning |
| Training Agent | ✅ | `ml-service/agents/training_agent.py` (15.5KB) | Model training |
| Insights Agent | ✅ | `ml-service/agents/insights_agent.py` (16.2KB) | Result insights |
| Domain Agent | ✅ | `ml-service/agents/domain_agent.py` (7.7KB) | Domain detection |
| Content Agent | ✅ | `ml-service/agents/content_agent.py` (6.6KB) | Content generation |
| ML Database | ✅ | `20251202_ml_models.sql` | ml_models table |
| AutoML Service | ✅ | `src/lib/services/automlService.ts` (5.3KB) | Frontend service |
| Signal Emission | ❌ | - | Models don't emit signals |
| LabAI Integration | ❌ | - | Not connected to AI layer |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/signalEmitter.ts`
- [ ] Create ModelSignal interface (type, modelId, datasetId, score, confidence, timestamp)
- [ ] Signal types: anomaly, prediction, threshold_breach, trend_change, correlation
- [ ] `emit()` method to EventBus
- [ ] `processSignal()` - signals → AI → Workflow → Human

#### [MODIFY] `ml-service/agents/orchestrator.py`
- [ ] Integrate LabAI for model recommendations
- [ ] Add signal emission after training completion
- [ ] Emit events to frontend via WebSocket
- [ ] Add prediction deployment pipeline

#### [MODIFY] `src/pages/Models.tsx`
- [ ] Add LabAI model recommendations display
- [ ] Show signal outputs (not just predictions)
- [ ] Display confidence intervals
- [ ] Mobile-responsive layout

---

## PHASE 7: DASHBOARDS & VISUALIZATION

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Dashboards Page | 🔶 | `src/pages/Dashboards.tsx` (49 lines) | Placeholder "Coming Soon" |
| Dashboard Service | ✅ | `src/lib/services/dashboardService.ts` (20.8KB) | Backend ready |
| Pinned Dashboards | ✅ | `20251215_pinned_dashboards.sql` | Database ready |
| Chart Components | 🔶 | Various in components | Need consolidation |
| PromptBI | ❌ | - | Not integrated |
| Auto-Update | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/promptBIService.ts`
- [ ] Create PromptBIService class (interface abstraction)
- [ ] `createDashboard()` method
- [ ] `updateDashboard()` method
- [ ] `generateChart()` method
- [ ] `setAlert()` method
- [ ] `triggerRefresh()` method
- [ ] Mock implementation for development (API placeholder)

#### [NEW] `src/components/ai/ChartRenderer.tsx`
- [ ] Line, bar, pie, scatter chart rendering
- [ ] Responsive sizing
- [ ] Anomaly region highlighting
- [ ] AI annotation integration
- [ ] Data validation before render (no hallucination)

#### [MODIFY] `src/pages/Dashboards.tsx`
- [ ] Replace "Coming Soon" with functional dashboard
- [ ] Dynamic dashboard generation
- [ ] AI insight highlights panel
- [ ] Alert threshold configuration UI
- [ ] Mobile-first grid layout
- [ ] Batch refresh mechanism (not real-time for V1)

---

## PHASE 8: REPORTS GENERATION

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Reports Page | ✅ | `src/pages/Reports.tsx` (1369 lines, 58KB) | Full UI |
| Report Types | ✅ | ReportType, ExportFormat, ReportStatus | Defined |
| Report Modules | ✅ | summary, stats, charts, anomalies, recommendations, auditLog | Configurable |
| Scheduling | ✅ | ReportSchedule interface | Daily/weekly/monthly |
| AI Insights | ✅ | AIInsight interface in reports | Integration exists |
| Report Service | ✅ | `src/lib/services/reportService.ts` (3.7KB) | Basic service |
| Reporting Service | ✅ | `src/lib/services/reportingService.ts` (7.9KB) | Extended service |
| Export Formats | 🔶 | PDF, DOCX, HTML, CSV defined | Backend incomplete |
| International Templates | ❌ | - | Not implemented |
| PDF Generation | ❌ | - | Not implemented server-side |
| Workflow Trigger | ❌ | - | Auto-report not connected |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/reportTemplateService.ts`
- [ ] 5 international templates:
  - [ ] ICH-GCP (Clinical Research)
  - [ ] WHO/CDC (Population Health)
  - [ ] ISO/IEEE (Wearables Study)
  - [ ] ISO 14001/WHO (Environmental Health)
  - [ ] GDPR (Anonymization Summary)
- [ ] Template section definitions
- [ ] Required field validation
- [ ] Compliance checks

#### [NEW] `ml-service/report_generator.py`
- [ ] Jinja2 HTML templates
- [ ] WeasyPrint PDF generation
- [ ] python-docx DOCX generation
- [ ] Chart embedding in PDFs
- [ ] API endpoints for report generation

#### [MODIFY] `src/pages/Reports.tsx`
- [ ] Add international template selector
- [ ] Display AI insight sections in reports
- [ ] Connect to workflow for auto-generation
- [ ] Add team delivery configuration
- [ ] Mobile-friendly preview

---

## PHASE 9: COLLABORATION & NOTIFICATIONS

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Collaboration Page | ✅ | `src/pages/Collaboration.tsx` (18.5KB) | Full page |
| Collaboration Service | ✅ | `src/lib/services/collaborationService.ts` (30.6KB, 1192 lines) | Comprehensive |
| Team Members | ✅ | TeamMember interface | Roles, status, preferences |
| Chat Channels | ✅ | ChatChannel, ChatMessage | Slack-like |
| Direct Messages | ✅ | DirectMessage interface | DM support |
| Notifications | ✅ | Notification interface | Multiple types |
| Real-time | ✅ | RealtimeChannel integration | Supabase realtime |
| @LabAI Mentions | ❌ | - | Not implemented |
| Workflow Integration | ❌ | - | Not connected to events |
| Task Auto-Creation | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `src/lib/services/notificationService.ts`
- [ ] Multi-channel support (in-app, email, webhook)
- [ ] Urgency levels (low, medium, high, critical)
- [ ] Workflow event integration
- [ ] `notifyAnomaly()` method
- [ ] `notifyExperimentComplete()` method
- [ ] `notifyReportReady()` method
- [ ] `createTask()` method with auto-assignment

#### [MODIFY] `src/lib/services/collaborationService.ts`
- [ ] Add @LabAI mention handler
- [ ] AI task creation from escalations
- [ ] Discussion thread linking to experiments/datasets
- [ ] Activity feed for workflow events

#### [MODIFY] `src/pages/Collaboration.tsx`
- [ ] @LabAI mention support in threads
- [ ] Automated task display
- [ ] Experiment/dataset links in discussions
- [ ] Mobile-optimized chat interface

---

## PHASE 10: COMPLIANCE & SECURITY

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| RLS Policies | ✅ | Multiple migration files | Row-level security |
| Auth Guard | ✅ | `src/components/auth/AuthGuard.tsx` | Route protection |
| User Profiles | ✅ | Database tables exist | Basic profiles |
| Audit Log | ❌ | - | Not implemented |
| GDPR Compliance | ❌ | - | Not implemented |
| Data Subject Requests | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `supabase/migrations/20251223_compliance.sql`
- [ ] Create `audit_log` table
- [ ] Create `data_processing_records` table
- [ ] Create `data_subject_requests` table
- [ ] Enable RLS on all new tables
- [ ] Create audit trigger function

#### [NEW] `src/lib/services/complianceService.ts`
- [ ] `verifyGDPRCompliance()` method
- [ ] `generateDataProcessingRecord()` method
- [ ] `handleDataSubjectRequest()` method
- [ ] `verifyDeIdentification()` method
- [ ] `logAction()` - audit trail
- [ ] `getAuditTrail()` method

---

## PHASE 11: MOBILE-FIRST RESPONSIVENESS

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| MobileNav | ✅ | `src/components/MobileNav.tsx` (2KB) | Basic mobile nav |
| Sidebar | ✅ | `src/components/Sidebar.tsx` (7.3KB) | Collapsible |
| TopBar | ✅ | `src/components/TopBar.tsx` (10.5KB) | Responsive |
| Layout Components | ✅ | `src/components/layout/` (3 files) | MainLayout exists |
| Tailwind Config | ✅ | `tailwind.config.ts` (2.8KB) | Breakpoints defined |
| Responsive Grid | ❌ | - | No utility component |
| useMediaQuery | ❌ | - | Not implemented |
| PWA Support | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### [NEW] `src/hooks/useMediaQuery.ts`
- [ ] Breakpoint detection hook
- [ ] SSR-safe implementation
- [ ] Standard breakpoints (mobile, tablet, desktop, large)

#### [NEW] `src/components/layout/ResponsiveGrid.tsx`
- [ ] Auto-stacking grid component
- [ ] Breakpoint-aware columns
- [ ] Card collapse patterns

#### [MODIFY] All pages for mobile audit
- [ ] Dashboard - Card grid collapses to stack
- [ ] Datasets - Table becomes cards on mobile
- [ ] Experiments - Timeline view adapts
- [ ] Models - Training progress readable on small screens
- [ ] Reports - PDF preview with mobile-friendly zoom
- [ ] AI Assistant - Chat interface optimized for mobile
- [ ] Settings - Form fields stack vertically

---

## PHASE 12: AUTH & ONBOARDING (Modern Login Page) 🔐

### Existing Implementation

| Feature | Status | Current File(s) | Notes |
|---------|--------|-----------------|-------|
| Auth Guard | ✅ | `src/components/auth/AuthGuard.tsx` | Route protection |
| Supabase Auth | ✅ | `src/integrations/supabase/auth.ts` | Basic auth setup |
| Login UI | 🔶 | Basic login | Needs redesign |
| OAuth | ❌ | - | Google/GitHub not configured |
| Magic Link | ❌ | - | Not implemented |
| Onboarding | ❌ | - | Not implemented |

### V1 Plan - Build Checklist

#### AUTH STACK (100% FREE)
| Purpose | Tool | Cost |
|---------|------|------|
| Auth backend | Supabase Auth | $0 |
| OAuth providers | Google, GitHub | $0 |
| Email login | Magic link (passwordless) | $0 |
| Session handling | Supabase | $0 |
| User metadata | Supabase profiles table | $0 |

#### [NEW] `src/components/auth/AuthPage.tsx`
- [ ] Split-view layout (desktop: side-by-side, mobile: stacked)
- [ ] Dark/light mode support
- [ ] Responsive design

#### [NEW] `src/components/auth/BrandPanel.tsx`
- [ ] Logo + "LabIQ Health"
- [ ] Hero line: "Experience liftoff with intelligent health data"
- [ ] Supporting line about explainable AI
- [ ] Dynamic visual animation

#### [NEW] `src/components/auth/HealthAnimation.tsx`
- [ ] Animated waveform/health signal lines (CSS animation)
- [ ] Pulsing data nodes
- [ ] Subtle gradient motion
- [ ] Use: Framer Motion or pure CSS

#### [NEW] `src/components/auth/AuthCard.tsx`
- [ ] Title: "Welcome to LabIQ Health"
- [ ] Subtitle: "Get started in seconds. No credit card."
- [ ] Google OAuth button (🟥 Continue with Google)
- [ ] GitHub OAuth button (⬛ Continue with GitHub)
- [ ] Divider "or"
- [ ] Magic link email input
- [ ] Trust signals (🔒 End-to-end encrypted, 🌍 Global standards, 🧠 Explainable AI)
- [ ] Dynamic hover/click effects

#### [NEW] `src/components/auth/OnboardingQuestion.tsx`
- [ ] Single question: "What best describes your goal?"
- [ ] Option 1: 📊 Analyze wearable or health data → Analyst mode
- [ ] Option 2: 🧪 Research / population health → ML mode
- [ ] Option 3: 📘 Learn & explore health insights → Learn mode
- [ ] Store selection in user profile
- [ ] Set intelligent defaults

#### [MODIFY] Supabase Configuration
- [ ] Enable Google OAuth provider
- [ ] Enable GitHub OAuth provider
- [ ] Configure magic link emails

#### Compliance Footer
- [ ] Add: "LabIQ Health is a data intelligence platform. It does not provide medical advice or diagnosis."

---

## PHASE 13: FREE DEPLOYMENT INFRASTRUCTURE 🚀

### Agent Hosting Matrix

| Agent/Service | Host | File |
|---------------|------|------|
| Data Agent | Render (ml-service) | `ml-service/agents/data_agent.py` |
| Feature Agent | Render (ml-service) | `ml-service/agents/feature_agent.py` |
| Model Selection Agent | Render (ml-service) | `ml-service/agents/model_selection_agent.py` |
| Hyperparameter Agent | Render (ml-service) | `ml-service/agents/hyperparameter_agent.py` |
| Training Agent | Render (ml-service) | `ml-service/agents/training_agent.py` |
| Insights Agent | Render (ml-service) | `ml-service/agents/insights_agent.py` |
| LabAI Agent | Render (ml-service) | `ml-service/agents/labai_agent.py` |
| Orchestrator Agent | Render (ml-service) | `ml-service/agents/orchestrator.py` |
| Report Generator | Render (ml-service) | `ml-service/report_generator.py` |
| LabIQAI (Frontend) | Vercel (client-side) | `src/lib/ai/LabIQAI.ts` |
| Event Bus | Vercel (client-side) | `src/lib/services/eventBus.ts` |
| Rules Engine | Vercel (client-side) | `src/lib/services/rulesEngine.ts` |
| Workflow Service | Vercel (client-side) | `src/lib/services/workflowService.ts` |

### Free Infrastructure Stack

| Service | Provider | Cost | What Lives Here |
|---------|----------|------|-----------------|
| Frontend Hosting | Vercel | $0 (100GB bandwidth) | React app, static assets |
| Backend API | Render | $0 (750 hrs/month) | FastAPI, all Python agents |
| Database | Supabase | $0 (500MB, 50K requests) | PostgreSQL, RLS, all tables |
| Authentication | Supabase Auth | $0 | OAuth, magic links, sessions |
| File Storage | Supabase Storage | $0 (1GB) | Datasets, reports, avatars |
| AI APIs | GROQ | $0 (generous limits) | Fast summaries, Analyst mode |
| AI APIs | Gemini | $0 (1500 req/day) | Deep reasoning, Learn mode |
| AI APIs | Anthropic | $0 (limits) | Fallback, complex reasoning |
| ML Compute | CPU-based | $0 | scikit-learn, PyCaret, XGBoost |
| Scheduling | GitHub Actions | $0 (2000 mins/month) | Cron jobs, batch processing |
| Email | Resend | $0 (100/day) | Magic links, notifications |
| Realtime | Supabase Realtime | $0 | Chat, presence, live updates |

### Migration Checklist

- [ ] Create Vercel project and link repo
- [ ] Create Render web service for ml-service
- [ ] Set up Supabase project with production keys
- [ ] Configure GROQ API key (`VITE_GROQ_API_KEY`)
- [ ] Configure Gemini API key (`VITE_GEMINI_API_KEY`)
- [ ] Configure Anthropic API key (`VITE_ANTHROPIC_API_KEY`)
- [ ] Set up Resend for transactional emails
- [ ] Configure Google OAuth in Supabase
- [ ] Configure GitHub OAuth in Supabase
- [ ] Run database migrations in production
- [ ] Set up GitHub Actions for cron jobs
- [ ] Test full E2E flow in production

### Implementation Files

- [ ] `docker-compose.yml`
- [ ] `Dockerfile.frontend`
- [ ] `ml-service/Dockerfile`
- [ ] `render.yaml`
- [ ] `vercel.json`
- [ ] `.github/workflows/cron.yml`

---

## 📋 MILESTONES TRACKING

| Milestone | Day | Status | Notes |
|-----------|-----|--------|-------|
| Event System + Rules Engine | 1 | ⬜ | |
| AI Assistant Foundation | 2 | ⬜ | |
| Workflow-Experiment Integration | 3 | ⬜ | |
| Model Signal Loop Complete | 4 | ⬜ | |
| Week 1 Core Flow Done | 5 | ⬜ | |
| Dashboards Working | 8 | ⬜ | |
| Reports Generating | 9 | ⬜ | |
| Collaboration Enhanced | 10 | ⬜ | |
| Mobile Responsiveness Complete | 11 | ⬜ | |
| Auth & Onboarding Complete | 12 | ⬜ | |
| Deployment Ready | 12 | ⬜ | |
| V1 MVP Ready | 12 | ⬜ | |

---

## ✅ FINAL DELIVERABLES CHECKLIST

### Core Systems
- [ ] Event-driven workflow engine with 5 canonical rules
- [ ] 3-mode AI Assistant (Analyst/ML/Learn) with safety guardrails
- [ ] Automatic experiment creation from datasets
- [ ] Signal-based model outputs with AI interpretation

### User-Facing Features
- [ ] PromptBI-ready dashboard system
- [ ] International report templates (WHO, ICH-GCP, ISO)
- [ ] @LabAI mentions in collaboration
- [ ] Full mobile responsiveness
- [ ] Modern login/signup page with OAuth

### Auth & Onboarding
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Magic link (passwordless) login
- [ ] Smart onboarding question
- [ ] Compliance footer

### Compliance & Security
- [ ] Anonymization pipeline
- [ ] Audit trail logging
- [ ] GDPR compliance hooks

### Deployment
- [ ] Vercel frontend deployment
- [ ] Render backend deployment
- [ ] Supabase production setup
- [ ] All free-tier API keys configured

### Documentation
- [ ] README updated
- [ ] API documentation
- [ ] Deployment guide

---

## 🔥 FINAL V1 MESSAGE

> **LabIQ Health is an automated health intelligence platform that turns raw health data into explainable insights, models, and reports — without coding, without black-box AI, and without clinical risk.**

---

*Implementation Plan Version: 3.0*  
*Created: 2025-12-22*  
*Updated: 2025-12-23*  
*Platform: LabIQ Health V1*
