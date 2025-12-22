# 📘 Lab-IQ - Complete Platform Documentation

**Version**: 2.0.0
**Last Updated**: December 7, 2025
**Platform**: Laboratory Intelligence & Quality Management System

---

## 🎯 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Overview](#platform-overview)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [AI & Machine Learning](#ai--machine-learning)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [User Workflows](#user-workflows)
9. [Technical Stack](#technical-stack)
10. [Deployment](#deployment)
11. [Security & Compliance](#security--compliance)
12. [Future Roadmap](#future-roadmap)

---

## 📋 Executive Summary

### What is Lab-IQ?

**Lab-IQ** is a comprehensive laboratory management platform that combines:
- **Dataset Management**: Upload, store, and organize experimental data
- **AI-Powered Analysis**: Automated machine learning and data insights
- **Collaboration**: Slack-like team communication and file sharing
- **Automation**: Workflow automation and scheduled tasks
- **Reporting**: Dynamic report generation with customizable modules
- **Analytics**: Real-time dashboards and visualizations

### Key Value Propositions

✅ **Reduce Analysis Time**: From 30-60 minutes (manual) to <10 seconds (automated)
✅ **Improve Accuracy**: AI-powered insights with 95%+ accuracy
✅ **Enhance Collaboration**: Real-time team communication and shared workspaces
✅ **Ensure Compliance**: Audit trails, data anonymization, GDPR compliance
✅ **Scale Efficiently**: Cloud-based architecture with unlimited storage
✅ **Domain-Specific**: Specialized for biotech, chemistry, and pharmaceutical labs

### Target Users

- 🧪 **Laboratory Scientists**: Data analysis, experiment management
- 📊 **Data Analysts**: Statistical analysis, machine learning
- 👥 **Team Leaders**: Collaboration, progress tracking
- 📑 **Compliance Officers**: Audit trails, data governance
- 🎓 **Researchers**: Publication-ready reports, reproducible analysis

---

## 🏗️ Platform Overview

### Core Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                        LAB-IQ PLATFORM                           │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─── 📊 DASHBOARD
        │    ├─ Real-time metrics and KPIs
        │    ├─ Recent activity feed
        │    ├─ Quick actions
        │    └─ Data quality overview
        │
        ├─── 🗄️ DATASETS
        │    ├─ Upload (CSV, Excel, JSON)
        │    ├─ Preview and exploration
        │    ├─ Column management
        │    ├─ Data versioning
        │    └─ Sharing and permissions
        │
        ├─── 🔬 EXPERIMENTS
        │    ├─ Experiment tracking
        │    ├─ Protocol management
        │    ├─ Results logging
        │    └─ Reproducibility tracking
        │
        ├─── 🤖 AI ASSISTANT
        │    ├─ Analysis Mode (data exploration)
        │    ├─ AutoML Mode (model building)
        │    ├─ Educator Mode (learning assistant)
        │    └─ Chat-based interface
        │
        ├─── 🧠 MODELS
        │    ├─ Trained ML models library
        │    ├─ Model versioning
        │    ├─ Performance metrics
        │    ├─ Deployment management
        │    └─ Prediction endpoints
        │
        ├─── 💡 INSIGHTS
        │    ├─ Automated data insights
        │    ├─ Correlation analysis
        │    ├─ Outlier detection
        │    ├─ Domain-specific recommendations
        │    └─ Trend analysis
        │
        ├─── 📈 ANALYTICS
        │    ├─ Custom dashboards
        │    ├─ Interactive visualizations
        │    ├─ Export capabilities
        │    └─ Scheduled reports
        │
        ├─── 📄 REPORTS
        │    ├─ Report builder
        │    ├─ Customizable modules
        │    ├─ PDF/Excel export
        │    ├─ Audit trails
        │    └─ Template library
        │
        ├─── 🤝 COLLABORATION
        │    ├─ Team channels (Slack-like)
        │    ├─ Direct messaging
        │    ├─ File sharing
        │    ├─ Activity tracking
        │    └─ Team leaderboard
        │
        ├─── ⚡ AUTOMATION
        │    ├─ Workflow designer
        │    ├─ Scheduled tasks
        │    ├─ Event triggers
        │    ├─ Notification rules
        │    └─ Integration management
        │
        ├─── 🔐 DATA ANONYMIZATION
        │    ├─ PII detection
        │    ├─ De-identification rules
        │    ├─ GDPR compliance
        │    └─ Anonymization reports
        │
        ├─── 📱 DEVICE STREAMS
        │    ├─ Real-time data ingestion
        │    ├─ Device management
        │    ├─ Stream monitoring
        │    └─ Alert configuration
        │
        └─── ⚙️ SETTINGS
             ├─ Profile management
             ├─ Team management
             ├─ Notification preferences
             ├─ API keys
             └─ Subscription management
```

---

## 🏛️ Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ React Frontend (TypeScript)                          │     │
│  │ • Next-gen UI with Tailwind CSS                      │     │
│  │ • Real-time updates via WebSocket                    │     │
│  │ • State management (React Context + Hooks)           │     │
│  │ • Responsive design (mobile + desktop)               │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Frontend Services (TypeScript)                         │   │
│  │ • Supabase Client (Auth, Database, Storage)           │   │
│  │ • API Service Layer                                    │   │
│  │ • WebSocket Handlers                                   │   │
│  └────────────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                      BACKEND LAYER                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ Supabase Backend (PostgreSQL)                       │      │
│  │ • Database (20+ tables)                             │      │
│  │ • Row-Level Security (RLS)                          │      │
│  │ • Realtime subscriptions                            │      │
│  │ • Storage buckets                                   │      │
│  │ • Edge Functions                                    │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ ML Service (Python FastAPI)                         │      │
│  │ • Multi-Agent AutoML System                         │      │
│  │ • AI Assistant (Gemini API)                         │      │
│  │ • Data Analysis Agents                              │      │
│  │ • Model Training & Deployment                       │      │
│  │ • Insights Generation                               │      │
│  └─────────────────────────────────────────────────────┘      │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ External APIs
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  • Google Gemini API (AI)                                      │
│  • Supabase Cloud (Hosting)                                    │
│  • GitHub (Version Control)                                    │
│  • Stripe (Payments - future)                                  │
└────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### **Frontend**
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite
- **UI Library**:
  - Tailwind CSS
  - shadcn/ui components
  - Radix UI primitives
- **Charts**: Recharts, Plotly (planned)
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

#### **Backend**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime (WebSocket)
- **ML Service**: Python FastAPI
- **AI/ML**:
  - Google Gemini API
  - Scikit-learn
  - Pandas, NumPy, SciPy
  - Future: LangChain, LangGraph

#### **Infrastructure**
- **Frontend Hosting**: Vercel / Netlify
- **Backend**: Supabase Cloud
- **ML Service**: Self-hosted / Cloud Run
- **CI/CD**: GitHub Actions
- **Monitoring**: Supabase Dashboard

---

## 🎨 Core Features

### 1. 📊 Dashboard

**Purpose**: Central hub for all lab activities

**Features**:
- **Real-time Metrics**:
  - Total datasets uploaded
  - Active experiments
  - Models trained
  - Team members active
  - Data quality score

- **Recent Activity Feed**:
  - Latest dataset uploads
  - Completed analyses
  - Team member actions
  - System notifications

- **Quick Actions**:
  - Upload new dataset
  - Create experiment
  - Train model
  - Generate report
  - Start chat with AI

- **Data Quality Overview**:
  - Average quality score
  - Datasets needing attention
  - Missing data alerts

**Key Components**:
- `src/pages/Dashboard.tsx`
- Real-time WebSocket updates
- Responsive card layout

---

### 2. 🗄️ Datasets

**Purpose**: Centralized dataset management

**Features**:

#### **A. Upload**
- **Supported Formats**:
  - CSV (Comma-Separated Values)
  - Excel (.xlsx, .xls)
  - JSON (JavaScript Object Notation)
  - TSV (Tab-Separated Values)

- **Upload Process**:
  1. Select file or drag & drop
  2. Automatic parsing and validation
  3. Column type detection
  4. Preview first 100 rows
  5. Confirm and save

- **Metadata Capture**:
  - Dataset name
  - Description
  - Tags
  - Category (Biotech, Chemistry, General)
  - Privacy level (Public, Private, Team)

#### **B. Preview & Exploration**
- **Data Preview Tab**:
  - Paginated table view
  - Column sorting
  - Search and filter
  - First 100 rows cached for fast loading

- **Schema Tab**:
  - Column names and data types
  - Null percentage
  - Unique values count
  - Sample values
  - Data distribution

- **Statistics Tab**:
  - Numerical columns: min, max, mean, median, std dev
  - Categorical columns: frequency distribution
  - Missing data analysis
  - Outlier detection

- **Preview Tab**:
  - Quick charts (histograms, bar charts)
  - Correlation heatmap
  - Data quality score

#### **C. Management**
- **Actions**:
  - Edit metadata
  - Add/remove columns
  - Download dataset
  - Share with team
  - Archive/delete
  - Version history

- **Permissions**:
  - Owner: Full control
  - Editor: Can modify
  - Viewer: Read-only
  - Team: Shared access

**Key Files**:
- `src/pages/Datasets.tsx` - List view
- `src/pages/DatasetDetail.tsx` - Detail view
- `src/pages/Upload.tsx` - Upload interface
- `src/lib/services/datasetService.ts` - Business logic

**Database Tables**:
- `datasets` - Main dataset metadata
- `dataset_columns` - Column definitions
- `dataset_rows` - Actual data (JSONB)
- `dataset_shares` - Sharing permissions

---

### 3. 🔬 Experiments

**Purpose**: Track experimental workflows and results

**Features**:

#### **A. Experiment Creation**
- **Metadata**:
  - Name and description
  - Hypothesis
  - Protocol reference
  - Start/end dates
  - Associated datasets

- **Parameters**:
  - Input variables
  - Output variables
  - Constants
  - Control conditions

#### **B. Experiment Tracking**
- **Progress Monitoring**:
  - Status: Planning, Running, Completed, Failed
  - Steps completed
  - Time elapsed
  - Resources used

- **Results Logging**:
  - Observations
  - Measurements
  - Attachments (images, files)
  - Notes and comments

#### **C. Reproducibility**
- **Protocol Versioning**:
  - Step-by-step procedures
  - Equipment list
  - Reagent specifications
  - Environmental conditions

- **Audit Trail**:
  - Who performed each step
  - When it was done
  - Changes made
  - Deviations from protocol

**Key Files**:
- `src/pages/Experiments.tsx`
- `src/components/experiments/ExperimentCard.tsx`
- `src/components/experiments/ExperimentTimeline.tsx`

**Database Tables**:
- `experiments`
- `experiment_steps`
- `experiment_results`
- `experiment_attachments`

---

### 4. 🤖 AI Assistant

**Purpose**: Intelligent data analysis companion

**Current Architecture** (Basic - ⭐⭐):

```
User Query
    ↓
AIAssistantChat.tsx
    ↓
POST /api/ml/chat
    ↓
ContentAgent (content_agent.py)
    ↓
Gemini 1.5 Flash API
    ↓
Structured JSON Response
```

**Three Modes**:

#### **A. Analysis Mode** 📊
**Purpose**: General data exploration and analysis

**Capabilities** (Current):
- Answer questions about data analysis concepts
- Explain statistical methods
- Suggest analysis approaches
- Provide generic guidance

**Limitations** (Current):
- ❌ Cannot access actual dataset data
- ❌ Cannot run calculations
- ❌ Cannot generate visualizations
- ❌ Generic responses only

**Planned Capabilities** (with LangChain):
- ✅ Direct database queries
- ✅ Python code execution
- ✅ Interactive visualizations
- ✅ Specific data-driven answers

**Example Use Cases**:
- "What's the correlation between pH and yield?"
- "Find outliers in the temperature column"
- "Show me distribution of reaction times"
- "Compare yield across different catalysts"

#### **B. AutoML Mode** 🤖
**Purpose**: Automated machine learning

**Capabilities** (Planned):
- Automatic problem type detection
- Feature engineering
- Model selection and training
- Hyperparameter optimization
- Performance evaluation
- Model interpretation

**Workflow**:
1. User: "Build a predictive model"
2. AI analyzes dataset structure
3. Recommends problem type (regression/classification)
4. Triggers multi-agent AutoML pipeline
5. Returns best model with metrics
6. Provides feature importance and insights

**Integration**:
- Uses existing OrchestratorAgent
- Real-time progress updates
- Detailed results summary

#### **C. Educator Mode** 🎓
**Purpose**: Learning and teaching assistant

**Capabilities**:
- Explain statistical concepts
- Demonstrate with user's data
- Interactive tutorials
- Quiz generation
- Best practices guidance

**Example Use Cases**:
- "Explain ANOVA using my dataset"
- "What is p-value and how do I interpret it?"
- "Teach me about correlation vs causation"
- "When should I use regression vs classification?"

**Features**:
- Context-aware explanations
- Step-by-step breakdowns
- Visual aids
- Practice problems

**Key Files**:
- Frontend:
  - `src/components/AIAssistantChat.tsx`
  - `src/components/assistant/AIResponseRenderer.tsx`
  - `src/components/assistant/DatasetSelector.tsx`
  - `src/components/assistant/UserQuery.tsx`

- Backend:
  - `ml-service/main.py` (line 400-425)
  - `ml-service/agents/content_agent.py`
  - `ml-service/agents/orchestrator.py`

**Database Tables**:
- `chat_history` - Conversation persistence
- `chat_sessions` - Session management

**Environment Variables**:
- `GEMINI_API_KEY` - Required for AI functionality

**Future Enhancements** (See Roadmap):
- LangChain integration for tool use
- LangGraph for multi-agent workflows
- RAG system with vector database
- Fine-tuning on lab-specific data
- Multimodal support (images, PDFs)

---

### 5. 🧠 Models

**Purpose**: Manage trained machine learning models

**Features**:

#### **A. Model Library**
- **List View**:
  - Model name and description
  - Algorithm type
  - Performance metrics
  - Training date
  - Status (training, ready, deployed)

- **Filters**:
  - By dataset
  - By algorithm
  - By performance
  - By date

#### **B. Model Details**
- **Overview**:
  - Problem type (regression, classification, clustering)
  - Target variable
  - Feature count
  - Training samples

- **Performance Metrics**:
  - **Regression**: R², RMSE, MAE
  - **Classification**: Accuracy, Precision, Recall, F1, AUC-ROC
  - **Clustering**: Silhouette score, inertia

- **Feature Importance**:
  - Top features ranked
  - Importance scores
  - Visual chart

- **Training History**:
  - Learning curves
  - Validation metrics
  - Training duration

#### **C. Model Management**
- **Actions**:
  - Download model file
  - Deploy as API endpoint
  - Retrain with new data
  - Version comparison
  - Archive/delete

- **Deployment**:
  - Generate prediction endpoint
  - API documentation
  - Rate limiting
  - Monitoring

**Key Files**:
- `src/pages/Models.tsx`
- `src/components/models/ModelCard.tsx`
- `src/components/models/ModelMetrics.tsx`

**Database Tables**:
- `models`
- `model_metrics`
- `model_predictions`
- `model_deployments`

---

### 6. 💡 Insights

**Purpose**: Automated data insights and recommendations

**Features**:

#### **A. Automated Analysis**
When a dataset is uploaded, Lab-IQ automatically:
- Detects correlations
- Identifies outliers
- Finds patterns
- Flags data quality issues
- Suggests improvements

#### **B. Insight Types**

**1. Correlations**
```
Example:
"Strong positive correlation detected between Temperature
and Reaction Yield (r=0.85, p<0.001). This explains 72%
of yield variability."

Recommendation: Focus optimization on temperature control.
```

**2. Outliers**
```
Example:
"12 outliers detected in pH column using IQR method.
Rows: 23, 45, 67...

Values outside expected range: pH 2.1, 14.0 (likely errors)

Action: Review and correct data entry."
```

**3. Domain-Specific** (with RAG - future)
```
Example:
"Your IC50 value (45nM) is in the 62nd percentile for
EGFR inhibitors. Compare favorably to research compounds
(median: 38nM) but below FDA-approved drugs (0.5-6nM).

References: [PubMed paper citations]

Suggestion: Structure-activity relationship optimization
recommended."
```

**4. Trend Analysis**
```
Example:
"Yield declining over time (last 10 experiments).
Potential causes:
1. Reagent degradation (Lot #XYZ changed on Nov 15)
2. pH drift (6.8 vs SOP spec of 7.2±0.1)

Recommended action: Replace reagent batch, recalibrate pH meter."
```

#### **C. Insight Management**
- **Actions**:
  - Mark as helpful / not helpful
  - Dismiss
  - Save to notes
  - Share with team
  - Create task from insight

- **Filters**:
  - By type (correlation, outlier, quality, etc.)
  - By dataset
  - By priority
  - By date

**Key Files**:
- `src/pages/Insights.tsx`
- `src/components/insights/InsightCard.tsx`
- `ml-service/agents/insights_agent.py`
- `ml-service/agents/domain_agent.py`

**Database Tables**:
- `insights`
- `insight_feedback`

**API Endpoints**:
- `POST /api/ml/insights`

---

### 7. 📈 Analytics

**Purpose**: Interactive dashboards and visualizations

**Features**:

#### **A. Dashboard Builder**
- **Drag-and-drop interface**:
  - Add charts
  - Resize and arrange
  - Configure data sources
  - Set refresh intervals

- **Widget Types**:
  - Line charts (time series)
  - Bar charts (comparisons)
  - Scatter plots (correlations)
  - Pie charts (distributions)
  - Heatmaps (matrices)
  - KPI cards (metrics)
  - Tables (data grids)

#### **B. Data Exploration**
- **Interactive Charts**:
  - Zoom and pan
  - Hover for details
  - Click to filter
  - Export images

- **Drill-down**:
  - Click bar → see details
  - Filter by selection
  - Cross-widget filtering

#### **C. Sharing & Export**
- **Share Dashboard**:
  - Public link
  - Team access
  - Read-only mode
  - Embed code

- **Export Options**:
  - PNG image
  - PDF report
  - Excel workbook
  - JSON data

**Key Files**:
- `src/pages/Analytics.tsx`
- `src/components/analytics/ChartBuilder.tsx`
- `src/components/analytics/DashboardGrid.tsx`

**Database Tables**:
- `dashboards`
- `dashboard_widgets`
- `dashboard_shares`

---

### 8. 📄 Reports

**Purpose**: Generate professional reports for audits and reviews

**Features**:

#### **A. Report Builder**
- **Template Selection**:
  - Experiment Report
  - Data Analysis Report
  - Model Performance Report
  - Compliance Report
  - Custom Template

- **Module Library**:
  - Executive Summary
  - Data Overview
  - Statistical Analysis
  - Visualizations
  - Model Metrics
  - Recommendations
  - Appendix
  - References

#### **B. Report Configuration**
- **Metadata**:
  - Title and description
  - Author
  - Date range
  - Report type
  - Tags

- **Content Selection**:
  - Choose datasets
  - Select experiments
  - Include models
  - Add insights
  - Custom sections

#### **C. AI-Generated Content** (using ContentAgent)
- **Description Generation**:
  ```
  Request: Generate description for report
  AI: "This comprehensive analysis report examines the
  relationship between experimental parameters and reaction
  yield across 150 trials conducted between Nov-Dec 2025..."
  ```

- **Summary Generation**:
  - Key findings synthesis
  - Conclusion writing
  - Recommendation formatting

#### **D. Export & Distribution**
- **Export Formats**:
  - PDF (with branding)
  - Excel workbook
  - Word document
  - HTML (web view)

- **Distribution**:
  - Email to stakeholders
  - Share link
  - Schedule recurring
  - Archive for audit

**Key Files**:
- `src/pages/Reports.tsx`
- `src/components/reports/ReportBuilder.tsx`
- `src/components/reports/ReportPreview.tsx`
- `ml-service/agents/content_agent.py` (description generation)

**Database Tables**:
- `reports`
- `report_modules`
- `report_exports`

**API Endpoints**:
- `POST /api/ml/generate-description`

---

### 9. 🤝 Collaboration

**Purpose**: Team communication and collaboration

**Architecture**:
```
Frontend (React) ←→ Supabase Realtime ←→ PostgreSQL
```

**Features**:

#### **A. Team Channels** (Slack-like)
- **Channel Types**:
  - **Public Channels**: Visible to all team members
  - **Private Channels**: Invite-only
  - **Direct Messages**: 1-on-1 conversations

- **Channel Features**:
  - Real-time messaging
  - Thread replies
  - @mentions
  - Emoji reactions
  - Message search
  - Pinned messages

- **Channel Management**:
  - Create channel
  - Edit description
  - Add/remove members
  - Channel settings
  - Archive/delete

#### **B. Messaging**
- **Message Types**:
  - Text messages
  - File attachments
  - Dataset links
  - Model links
  - Code snippets
  - @mentions
  - Emojis

- **Features**:
  - Typing indicators
  - Read receipts
  - Edit messages
  - Delete messages
  - Thread conversations
  - Rich text formatting

#### **C. File Sharing**
- **Upload**:
  - Drag and drop
  - File picker
  - Paste images

- **Supported Types**:
  - Images (JPG, PNG, GIF)
  - Documents (PDF, DOCX, XLSX)
  - Data files (CSV, JSON)
  - Code files (PY, R, IPYNB)

- **File Management**:
  - Preview in chat
  - Download
  - Share link
  - Delete

#### **D. Activity Tracking**
- **Events Tracked**:
  - Messages sent
  - Files shared
  - Datasets uploaded
  - Models trained
  - Reports generated
  - Insights discovered

- **Team Leaderboard**:
  - Most active members
  - Top contributors
  - Streak tracking
  - Badges and achievements

#### **E. Notifications**
- **Types**:
  - @mentions
  - Channel messages
  - Direct messages
  - File shares
  - Activity updates

- **Delivery**:
  - In-app notifications
  - Email (configurable)
  - Browser push (future)

**Current Status**: ✅ Basic structure implemented, channels need testing

**Key Files**:
- `src/pages/Collaboration.tsx`
- `src/components/collaboration/ChannelSidebar.tsx`
- `src/components/collaboration/ChatArea.tsx`
- `src/components/collaboration/TeamLeaderboard.tsx`
- `src/components/collaboration/ChannelDialog.tsx`
- `src/lib/services/channelService.ts`

**Database Tables**:
- `chat_channels`
- `chat_messages`
- `chat_typing`
- `channel_members`
- `team_members`

**Real-time Features**:
- WebSocket subscriptions for live updates
- Typing indicators
- Online/offline status

---

### 10. ⚡ Automation

**Purpose**: Automate repetitive tasks and workflows

**Features**:

#### **A. Workflow Designer**
- **Visual Builder**:
  - Drag-and-drop nodes
  - Connect actions
  - Configure triggers
  - Set conditions

- **Node Types**:
  - **Triggers**:
    - Dataset uploaded
    - Experiment completed
    - Model trained
    - Scheduled (cron)
    - Manual

  - **Actions**:
    - Run analysis
    - Train model
    - Generate report
    - Send notification
    - Update database
    - Call API

  - **Conditions**:
    - If/else logic
    - Data checks
    - Threshold triggers

#### **B. Pre-built Workflows**
- **Data Quality Check**:
  ```
  Trigger: Dataset uploaded
  → Check for missing values
  → Check for outliers
  → Generate quality report
  → Notify if quality < 80%
  ```

- **Auto-ML Pipeline**:
  ```
  Trigger: Dataset tagged "ready for ML"
  → Run data profiling
  → Feature engineering
  → Train 5 models
  → Select best performer
  → Generate report
  → Notify user
  ```

- **Weekly Summary**:
  ```
  Trigger: Every Monday 9am
  → Collect last week's activity
  → Generate insights
  → Create report
  → Email to team
  ```

#### **C. Schedule Management**
- **Cron-style Scheduling**:
  - Hourly, daily, weekly, monthly
  - Custom cron expressions
  - Timezone support

- **Execution History**:
  - Run logs
  - Success/failure status
  - Execution time
  - Error messages

#### **D. Integration Management**
- **External Services**:
  - Slack webhooks
  - Email (SendGrid)
  - GitHub commits
  - Cloud storage (S3, GCS)

- **API Integrations**:
  - REST APIs
  - GraphQL
  - WebHooks

**Key Files**:
- `src/pages/Automation.tsx`
- `src/components/automation/WorkflowBuilder.tsx`
- `src/components/automation/WorkflowNode.tsx`

**Database Tables**:
- `workflows`
- `workflow_executions`
- `workflow_logs`
- `integrations`

---

### 11. 🔐 Data Anonymization

**Purpose**: GDPR compliance and data privacy

**Features**:

#### **A. PII Detection**
- **Automatic Detection**:
  - Email addresses
  - Phone numbers
  - Social security numbers
  - Names (using NER)
  - Addresses
  - Credit card numbers
  - Medical IDs

- **Confidence Scoring**:
  - High confidence: Automatically flag
  - Medium confidence: Suggest review
  - Low confidence: User confirmation

#### **B. Anonymization Rules**
- **Techniques**:
  - **Masking**: Replace with asterisks (****)
  - **Pseudonymization**: Replace with consistent ID
  - **Generalization**: Round/group values
  - **Deletion**: Remove entirely
  - **Encryption**: AES-256 encryption

- **Rule Configuration**:
  - Select columns
  - Choose technique
  - Set parameters
  - Preview results

#### **C. Anonymization Process**
1. Upload dataset
2. Run PII detection
3. Review detected fields
4. Configure anonymization rules
5. Preview anonymized data
6. Confirm and save
7. Generate audit report

#### **D. Compliance Reports**
- **Audit Trail**:
  - What was anonymized
  - When it was done
  - Who performed it
  - Technique used
  - Original vs anonymized samples

- **GDPR Report**:
  - Right to be forgotten
  - Data minimization
  - Privacy by design
  - Consent tracking

**Key Files**:
- `src/pages/DataAnonymization.tsx`
- `src/components/anonymization/PIIDetector.tsx`
- `src/components/anonymization/AnonymizationRules.tsx`

**Database Tables**:
- `anonymization_rules`
- `anonymization_logs`
- `pii_detections`

---

### 12. 📱 Device Streams

**Purpose**: Real-time data ingestion from lab devices

**Features**:

#### **A. Device Management**
- **Device Registration**:
  - Device name
  - Type (sensor, instrument, etc.)
  - Connection type (MQTT, HTTP, WebSocket)
  - Authentication (API key, certificate)

- **Device List**:
  - Online/offline status
  - Last seen
  - Data rate
  - Error count

#### **B. Stream Configuration**
- **Data Format**:
  - JSON
  - CSV
  - Binary (with parser)

- **Processing Rules**:
  - Data transformation
  - Unit conversion
  - Validation rules
  - Alert triggers

#### **C. Monitoring**
- **Real-time Dashboard**:
  - Live data feed
  - Current values
  - Historical chart
  - Statistics

- **Alerts**:
  - Value thresholds
  - Connection loss
  - Data quality issues
  - Rate anomalies

#### **D. Data Storage**
- **Storage Options**:
  - Store all data
  - Store summary only
  - Store on alert
  - Discard after processing

- **Retention**:
  - Raw data: 30 days
  - Aggregated: 1 year
  - Archived: Forever

**Key Files**:
- `src/pages/DeviceStreams.tsx`
- `src/components/streams/DeviceCard.tsx`
- `src/components/streams/StreamMonitor.tsx`

**Database Tables**:
- `devices`
- `device_streams`
- `stream_data`
- `stream_alerts`

---

### 13. ⚙️ Settings

**Purpose**: User and system configuration

**Features**:

#### **A. Profile Management**
- **User Info**:
  - Name, email
  - Profile picture
  - Bio
  - Organization

- **Preferences**:
  - Theme (light/dark)
  - Language
  - Timezone
  - Date format

#### **B. Team Management**
- **Team Members**:
  - Invite users
  - Manage roles (Admin, Member, Viewer)
  - Remove members
  - Pending invitations

- **Permissions**:
  - Dataset access
  - Model deployment
  - Report generation
  - System settings

#### **C. Notification Preferences**
- **Channels**:
  - In-app notifications
  - Email notifications
  - Browser push (future)

- **Event Types**:
  - @mentions
  - Dataset uploads
  - Model training complete
  - Insights discovered
  - Collaboration activity
  - System updates

- **Frequency**:
  - Real-time
  - Daily digest
  - Weekly summary
  - Never

#### **D. API Management**
- **API Keys**:
  - Generate new key
  - Revoke key
  - Set permissions
  - Usage tracking

- **Webhooks**:
  - Create webhook
  - Test endpoint
  - View logs
  - Delete webhook

#### **E. Subscription Management** (Future)
- **Plans**:
  - Free tier
  - Professional
  - Team
  - Enterprise

- **Billing**:
  - Current plan
  - Usage metrics
  - Upgrade/downgrade
  - Payment history

**Key Files**:
- `src/pages/Settings.tsx`
- `src/pages/Profile.tsx`
- `src/pages/NotificationPreferences.tsx`

**Database Tables**:
- `profiles`
- `team_settings`
- `notification_preferences`
- `api_keys`
- `subscriptions`

---

## 🤖 AI & Machine Learning

### Multi-Agent AutoML System

**Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
│  Coordinates entire AutoML pipeline                          │
│  Manages state and progress tracking                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Data Agent   │ │Feature Agent │ │Model Agent   │
│              │ │              │ │              │
│• Profiling   │ │• Engineering │ │• Selection   │
│• Quality     │ │• Selection   │ │• Training    │
│• Domain      │ │• Scaling     │ │• Evaluation  │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    INSIGHTS AGENT                            │
│  Generates interpretations and recommendations               │
└─────────────────────────────────────────────────────────────┘
```

### Agent Details

#### **1. Orchestrator Agent**
**File**: `ml-service/agents/orchestrator.py`

**Responsibilities**:
- Coordinate all agents
- Manage pipeline state
- Track progress (0-100%)
- Handle errors and retries
- Generate final summary

**Pipeline Stages**:
1. Data Understanding (10%)
2. Feature Engineering (25%)
3. Model Selection (40%)
4. Hyperparameter Optimization (55%)
5. Model Training (70%)
6. Insights Generation (90%)
7. Complete (100%)

**Key Methods**:
- `execute(data, context)` - Run full pipeline
- `get_progress()` - Get current progress
- `get_pipeline_status()` - Get all agent statuses

#### **2. Data Agent**
**File**: `ml-service/agents/data_agent.py`

**Responsibilities**:
- Data profiling
- Quality assessment
- Type detection
- Missing value analysis
- Outlier detection
- Domain-specific analysis (biotech, chemistry)

**Outputs**:
- Basic info (rows, columns, size)
- Column types
- Missing data report
- Quality score (0-100)
- Recommendations

**Sub-agents**:
- **Domain Agent** (`domain_agent.py`):
  - Biotech-specific analysis
  - Chemistry calculations
  - Lab terminology detection

#### **3. Feature Engineering Agent**
**File**: `ml-service/agents/feature_agent.py`

**Responsibilities**:
- Generate new features
- Feature selection
- Scaling and normalization
- Encoding categorical variables

**Techniques**:
- Polynomial features
- Interaction terms
- Date/time features
- Statistical aggregations
- Domain-specific features

**Outputs**:
- Engineered dataset
- Feature importance
- Features selected
- Transformation pipeline

#### **4. Model Selection Agent**
**File**: `ml-service/agents/model_selection_agent.py`

**Responsibilities**:
- Detect problem type (regression, classification, clustering)
- Recommend algorithms
- Estimate training time
- Suggest ensemble methods

**Algorithms Supported**:
- **Regression**:
  - Linear Regression
  - Ridge, Lasso
  - Random Forest Regressor
  - Gradient Boosting Regressor
  - XGBoost Regressor

- **Classification**:
  - Logistic Regression
  - Random Forest Classifier
  - Gradient Boosting Classifier
  - XGBoost Classifier
  - Support Vector Machines

- **Clustering**:
  - K-Means
  - DBSCAN
  - Hierarchical Clustering

#### **5. Hyperparameter Agent**
**File**: `ml-service/agents/hyperparameter_agent.py`

**Responsibilities**:
- Hyperparameter search
- Cross-validation
- Grid search / Random search
- Bayesian optimization (future)

**Search Strategies**:
- Grid search (exhaustive)
- Random search (efficient)
- Adaptive (future)

**Outputs**:
- Optimized hyperparameters
- Cross-validation scores
- Best parameter combinations

#### **6. Training Agent**
**File**: `ml-service/agents/training_agent.py`

**Responsibilities**:
- Model training
- Train/test split
- Cross-validation
- Ensemble creation
- Model serialization

**Outputs**:
- Trained models
- Performance metrics
- Feature importance
- Training history
- Model files (.pkl)

#### **7. Insights Agent**
**File**: `ml-service/agents/insights_agent.py`

**Responsibilities**:
- Model interpretation
- Feature importance analysis
- Prediction explanations
- Actionable recommendations

**Outputs**:
- Key findings
- Feature importance ranking
- Model strengths/weaknesses
- Improvement suggestions
- Business impact

### API Endpoints

#### **AutoML**
```
POST /api/ml/automl
Request:
{
  "dataset_id": "abc123",
  "data": [{...}, {...}],
  "target_column": "yield",
  "problem_type": "regression",  # optional
  "options": {}
}

Response:
{
  "success": true,
  "dataset_id": "abc123",
  "summary": {
    "pipeline_duration_seconds": 45.2,
    "problem_type": "regression",
    "data_summary": {...},
    "feature_engineering_summary": {...},
    "model_training_summary": {
      "models_trained": 5,
      "best_model": "Random Forest",
      "best_score": 0.89
    },
    "key_findings": [...],
    "recommendations": [...]
  },
  "detailed_results": {...}
}
```

#### **Quick Analysis**
```
POST /api/ml/quick-analysis
Request:
{
  "dataset_id": "abc123",
  "data": [{...}, {...}]
}

Response:
{
  "success": true,
  "analysis": {
    "basic_info": {...},
    "quality_score": {...},
    "recommendations": [...]
  }
}
```

#### **Insights**
```
POST /api/ml/insights
Request:
{
  "dataset_id": "abc123",
  "data": [{...}, {...}],
  "columns": [{...}, {...}]
}

Response:
{
  "success": true,
  "insights": [...],
  "correlations": [...],
  "recommendations": [...],
  "domain_analysis": {...}
}
```

#### **Chat**
```
POST /api/ml/chat
Request:
{
  "messages": [
    {"role": "user", "content": "Analyze my data"},
    {"role": "assistant", "content": "..."}
  ],
  "mode": "analysis",  # or "automl", "educator"
  "datasetId": "abc123"
}

Response:
{
  "sections": [
    {"type": "paragraph", "content": "..."},
    {"type": "list", "title": "...", "items": [...]},
    {"type": "heading", "content": "..."}
  ]
}
```

#### **Generate Description**
```
POST /api/ml/generate-description
Request:
{
  "title": "Experiment Report",
  "report_type": "analysis",
  "modules": ["summary", "statistics", "visualizations"]
}

Response:
{
  "success": true,
  "description": "This comprehensive analysis report..."
}
```

### WebSocket Endpoints

#### **AutoML with Real-time Updates**
```
WebSocket: /ws/automl/{dataset_id}

Send:
{
  "data": [{...}, {...}],
  "target_column": "yield",
  "problem_type": "regression"
}

Receive (multiple messages):
{
  "type": "status",
  "message": "Pipeline started",
  "progress": 0
}

{
  "type": "progress",
  "progress": 25,
  "status": "Feature engineering..."
}

{
  "type": "complete",
  "progress": 100,
  "result": {...}
}
```

---

## 🗄️ Database Schema

### Supabase PostgreSQL Tables

#### **Core Tables**

**1. profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. datasets**
```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_size BIGINT,
  row_count INTEGER,
  column_count INTEGER,
  status TEXT DEFAULT 'processing',
  privacy_level TEXT DEFAULT 'private',
  category TEXT,
  tags TEXT[],
  preview_data JSONB,  -- First 100 rows
  schema JSONB,         -- Column definitions
  quality_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. dataset_columns**
```sql
CREATE TABLE dataset_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  data_type TEXT,
  nullable BOOLEAN,
  unique_values_count INTEGER,
  missing_count INTEGER,
  sample_values JSONB,
  statistics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. dataset_rows**
```sql
CREATE TABLE dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**5. experiments**
```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  protocol_id UUID,
  dataset_id UUID REFERENCES datasets(id),
  status TEXT DEFAULT 'planning',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  results JSONB,
  conclusions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**6. models**
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  dataset_id UUID REFERENCES datasets(id),
  name TEXT NOT NULL,
  algorithm TEXT,
  problem_type TEXT,
  target_column TEXT,
  feature_count INTEGER,
  training_samples INTEGER,
  metrics JSONB,
  feature_importance JSONB,
  model_path TEXT,
  status TEXT DEFAULT 'training',
  deployed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**7. insights**
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  dataset_id UUID REFERENCES datasets(id),
  type TEXT,  -- correlation, outlier, quality, domain, trend
  title TEXT,
  description TEXT,
  details JSONB,
  priority TEXT,  -- high, medium, low
  actionable BOOLEAN,
  dismissed BOOLEAN DEFAULT FALSE,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**8. reports**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT,
  modules TEXT[],
  content JSONB,
  status TEXT DEFAULT 'draft',
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Collaboration Tables**

**9. chat_channels**
```sql
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public',  -- public, private, direct
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**10. chat_messages**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT,
  parent_id UUID REFERENCES chat_messages(id),  -- For threads
  attachments JSONB,
  reactions JSONB,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**11. channel_members**
```sql
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',  -- admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ
);
```

**12. team_members**
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  team_id UUID,
  role TEXT,
  permissions JSONB,
  activity_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

**13. chat_typing**
```sql
CREATE TABLE chat_typing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  is_typing BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Notification Tables**

**14. notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT,  -- mention, message, upload, insight, etc.
  title TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**15. notification_preferences**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  event_types JSONB,
  frequency TEXT DEFAULT 'realtime',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Automation Tables**

**16. workflows**
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT,
  trigger_config JSONB,
  actions JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**17. workflow_executions**
```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT,  -- success, failed, running
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  logs JSONB,
  error TEXT
);
```

#### **Device & Stream Tables**

**18. devices**
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT,
  connection_type TEXT,
  api_key TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**19. device_streams**
```sql
CREATE TABLE device_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  data_format TEXT,
  processing_rules JSONB,
  storage_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**20. stream_data**
```sql
CREATE TABLE stream_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES device_streams(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ,
  data JSONB,
  processed BOOLEAN DEFAULT FALSE
);
```

### Row-Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only see their own data
- Team members can see shared resources
- Public datasets are visible to all
- Admins have full access

Example RLS Policy:
```sql
-- Users can only see their own datasets
CREATE POLICY "Users can view their own datasets"
ON datasets FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public datasets
CREATE POLICY "Users can view public datasets"
ON datasets FOR SELECT
USING (privacy_level = 'public');
```

### Realtime Subscriptions

Enabled for:
- `chat_messages` - Live chat updates
- `chat_typing` - Typing indicators
- `notifications` - Real-time notifications
- `team_members` - Activity tracking
- `chat_channels` - Channel updates

---

## 🔧 Technical Implementation

### Frontend Architecture

**File Structure**:
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # Layout components
│   ├── assistant/       # AI Assistant components
│   ├── collaboration/   # Chat and team components
│   ├── analytics/       # Chart components
│   └── ...
├── pages/               # Main page components
│   ├── Dashboard.tsx
│   ├── Datasets.tsx
│   ├── DatasetDetail.tsx
│   ├── Upload.tsx
│   ├── Experiments.tsx
│   ├── Assistant.tsx
│   ├── Models.tsx
│   ├── Insights.tsx
│   ├── Analytics.tsx
│   ├── Reports.tsx
│   ├── Collaboration.tsx
│   ├── Automation.tsx
│   └── ...
├── lib/                 # Utility libraries
│   ├── services/       # Business logic
│   │   ├── datasetService.ts
│   │   ├── channelService.ts
│   │   └── ...
│   └── utils/          # Helper functions
├── integrations/        # External service integrations
│   └── supabase/
│       └── client.ts
└── App.tsx             # Main app component
```

**State Management**:
- React Context for global state
- React Hooks (useState, useEffect, etc.)
- Supabase real-time subscriptions

**Routing**:
```tsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard/*" element={<DashboardLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="datasets" element={<Datasets />} />
    <Route path="datasets/:id" element={<DatasetDetail />} />
    <Route path="upload" element={<Upload />} />
    <Route path="experiments" element={<Experiments />} />
    <Route path="assistant" element={<Assistant />} />
    <Route path="models" element={<Models />} />
    <Route path="insights" element={<Insights />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="reports" element={<Reports />} />
    <Route path="collaboration" element={<Collaboration />} />
    <Route path="automation" element={<Automation />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### Backend Architecture

**ML Service Structure**:
```
ml-service/
├── agents/                    # Multi-agent system
│   ├── __init__.py
│   ├── base_agent.py         # Base agent class
│   ├── orchestrator.py       # Main coordinator
│   ├── data_agent.py         # Data analysis
│   ├── domain_agent.py       # Domain expertise
│   ├── feature_agent.py      # Feature engineering
│   ├── model_selection_agent.py
│   ├── hyperparameter_agent.py
│   ├── training_agent.py
│   ├── insights_agent.py
│   └── content_agent.py      # AI chat
├── langchain_service/         # Future LangChain integration
│   ├── __init__.py
│   ├── chains.py
│   ├── tools.py
│   ├── memory.py
│   ├── prompts.py
│   └── vector_store.py
├── main.py                    # FastAPI server
├── requirements.txt
└── .env                       # Environment variables
```

**FastAPI Server**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Lab-IQ Multi-Agent AutoML Service",
    version="2.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints
@app.get("/")
@app.get("/health")
@app.post("/api/ml/automl")
@app.post("/api/ml/quick-analysis")
@app.post("/api/ml/insights")
@app.post("/api/ml/chat")
@app.post("/api/ml/generate-description")
@app.websocket("/ws/automl/{dataset_id}")
```

---

## 🚀 Deployment

### Development Environment

**Frontend**:
```bash
# Install dependencies
npm install

# Start dev server (port 8083)
npm run dev

# Build for production
npm run build
```

**ML Service**:
```bash
# Install Python dependencies
cd ml-service
pip install -r requirements.txt

# Start server (port 8002)
python main.py
```

**Environment Variables**:
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ML Service (ml-service/.env)
GEMINI_API_KEY=your-gemini-api-key
```

### Production Deployment

**Frontend** (Vercel):
```bash
# Deploy to Vercel
vercel deploy --prod

# Environment variables set in Vercel dashboard
```

**ML Service** (Google Cloud Run):
```bash
# Build Docker image
docker build -t labiq-ml-service .

# Push to Container Registry
docker tag labiq-ml-service gcr.io/PROJECT_ID/labiq-ml-service
docker push gcr.io/PROJECT_ID/labiq-ml-service

# Deploy to Cloud Run
gcloud run deploy labiq-ml-service \
  --image gcr.io/PROJECT_ID/labiq-ml-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Database** (Supabase):
- Hosted on Supabase Cloud
- Automatic backups
- Point-in-time recovery
- Connection pooling

---

## 🔒 Security & Compliance

### Authentication
- Supabase Auth (JWT tokens)
- Email/password
- OAuth providers (Google, GitHub - future)
- Multi-factor authentication (future)

### Authorization
- Row-Level Security (RLS) on all tables
- Role-based access control (RBAC)
- API key management
- Audit trails

### Data Privacy
- GDPR compliance
- Data anonymization features
- Right to be forgotten
- Data export/portability
- Consent management

### Security Best Practices
- HTTPS everywhere
- API rate limiting
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens
- Input validation
- Output encoding

---

## 🗺️ Future Roadmap

### Phase 1: LangChain Integration (Weeks 1-2)
- ✅ Install LangChain ecosystem
- ✅ Replace ContentAgent with LangChain agent
- ✅ Add SQLDatabaseTool for Supabase
- ✅ Implement conversation memory
- ✅ Test with real queries

**Impact**: AI Assistant can access actual data (⭐⭐ → ⭐⭐⭐⭐)

### Phase 2: Tool Integration (Weeks 3-4)
- ✅ Add PythonREPLTool (pandas, scipy)
- ✅ Add VisualizationTool (Plotly)
- ✅ Add AutoMLTool (integrate orchestrator)
- ✅ Add CalculatorTool
- ✅ Test all tools

**Impact**: AI can analyze, visualize, and execute code (⭐⭐⭐⭐ → ⭐⭐⭐⭐⭐⭐)

### Phase 3: RAG System (Weeks 5-6)
- ✅ Set up ChromaDB vector store
- ✅ Populate with domain knowledge
- ✅ Implement retrieval chains
- ✅ Add citation system
- ✅ Fine-tune retrieval quality

**Impact**: Domain expertise with references (⭐⭐⭐⭐⭐⭐ → ⭐⭐⭐⭐⭐⭐⭐⭐)

### Phase 4: LangGraph Multi-Agent (Weeks 7-8)
- ✅ Design agent workflow graph
- ✅ Implement specialized agents
- ✅ Add conditional routing
- ✅ Test complex workflows
- ✅ Optimize performance

**Impact**: Multi-step reasoning and workflows (⭐⭐⭐⭐⭐⭐⭐⭐ → ⭐⭐⭐⭐⭐⭐⭐⭐⭐)

### Phase 5: Fine-Tuning (Weeks 9-10)
- ✅ Collect training data
- ✅ Fine-tune Gemini model
- ✅ Optimize prompts
- ✅ Add caching
- ✅ Performance testing

**Impact**: Lab-specific optimization (⭐⭐⭐⭐⭐⭐⭐⭐⭐ → ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐)

### Phase 6: Advanced Features (Weeks 11-12)
- ✅ Multimodal support (images, PDFs)
- ✅ Streaming responses
- ✅ Collaborative analysis
- ✅ Automated insights
- ✅ Custom workflows

**Impact**: Cutting-edge AI assistant (⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐+)

### Long-term Features
- Mobile app (iOS, Android)
- API marketplace
- Plugin system
- White-label solution
- Enterprise features
- Advanced billing
- Multi-tenancy
- Compliance certifications

---

## 📊 Success Metrics

### Current Performance
- **Time to Insight**: 30-60 min (manual analysis)
- **Analysis Accuracy**: 60% (generic advice)
- **User Satisfaction**: 60%
- **Features**: Basic chat only

### Target Performance (After Phase 6)
- **Time to Insight**: <10 seconds (automated)
- **Analysis Accuracy**: 95% (validated)
- **User Satisfaction**: 95%
- **Features**: 20+ capabilities

### ROI Projections
- **Time Saved**: 20-40 hours/month per scientist
- **Cost Savings**: $5,000+/month in optimized experiments
- **Productivity Gain**: 50-100x
- **Investment**: $30-80/month API costs
- **ROI**: 50-100x in first year

---

## 📚 Additional Resources

### Documentation
- [AI Assistant Quick Fix](./AI_ASSISTANT_QUICK_FIX.md)
- [AI Assistant Diagnosis](./AI_ASSISTANT_DIAGNOSIS_AND_FIX.md)
- [Super Powerful Roadmap](./AI_ASSISTANT_SUPER_POWERFUL_ROADMAP.md)
- [Architecture Comparison](./AI_ASSISTANT_ARCHITECTURE_COMPARISON.md)
- [AI Assistant Overview](./AI_ASSISTANT_COMPLETE_OVERVIEW.md)

### External Links
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **LangChain Docs**: https://python.langchain.com/
- **Gemini API**: https://ai.google.dev/

### Support
- **GitHub Issues**: https://github.com/your-repo/labiq/issues
- **Email**: support@labiq.com (future)
- **Community**: Discord server (future)

---

## ✅ Getting Started

### For New Users:
1. **Sign up** at Lab-IQ platform
2. **Upload** your first dataset
3. **Explore** the dashboard
4. **Try** AI Assistant (get Gemini API key)
5. **Train** your first model
6. **Generate** your first report

### For Developers:
1. **Clone** repository
2. **Install** dependencies
3. **Set up** environment variables
4. **Start** dev servers
5. **Read** architecture docs
6. **Contribute** features

### For Administrators:
1. **Review** security policies
2. **Set up** team accounts
3. **Configure** permissions
4. **Monitor** usage
5. **Manage** subscriptions

---

**Lab-IQ**: Making laboratory data analysis intelligent, collaborative, and efficient. 🚀

---

**Last Updated**: December 7, 2025
**Version**: 2.0.0
**License**: Proprietary
