# DataIQ: The Definitive System Blueprint (100% Audit)

This document is the absolute source of truth for the **DataIQ** platform. It captures every architectural layer, feature set, and integration point found during a full-system audit. Use this as a master prompt to rebuild, refactor, or pivot the system.

---

## 1. High-Level Architecture
DataIQ follows a **Multi-Service, AI-Orchestrated** architecture:
- **Frontend Layer**: React SPA with a custom Dependency Injection (DI) system and Event-Driven UI.
- **Backend Layer (Supabase)**: Real-time DB, Auth, Edge Functions (Deno), and Storage.
- **ML Service Layer (Python)**: FastAPI + LangGraph + Gemini for advanced AutoML, analytics, and reporting.
- **Execution Layer (WASM)**: Browser-side execution of SQL (DuckDB), Python (Pyodide), and R (WebR).

---

## 2. Product Inventory (Master Features)

### A. Universal Data Ingestion Hub
A central gateway to connect **20+ data sources**, including SQL Databases (Postgres, MySQL, Snowflake), Cloud Storage (Google Drive, OneDrive), and Live API Integrations.

### B. AI-Orchestrated Analysis Notebooks
A dynamic workspace where analysts interact with data using **LangGraph-powered AI agents**. It features Generative UI cells for charts, tables, and a visible "Reasoning" card that reveals the AI's step-by-step logic.

### C. Command Center (The Dashboard)
A real-time operational hub featuring high-level **Metric Cards** (Usage, Capacity, Health), **Predictive Insight Cards**, and an automated **Activity Feed** for system-wide auditing.

### D. AutoML Experiment Registry
A framework for building, versioning, and deploying machine learning models. It manages the full pipeline: **Profiling -> Feature Engineering -> Training -> Evaluation -> Model Explanation**.

### E. No-Code Automation Rules Engine
An event-driven builder for setting up custom workflows. Users can define **Triggers** (e.g., "Data Quality Spike") and **Actions** (e.g., "Export Report" or "Alert Stakeholder").

### F. Privacy & Anonymization Pipeline
A security-first module that scans datasets for **PII/PHI (Personally Identifiable Information)** and applies automated masking and anonymization protocols to ensure compliance.

### G. Live Data Stream Processor
A specialized engine for handling real-time, high-frequency data telemetry, allowing for instant ingestion and live monitoring of fast-moving data streams.

### H. Automated Report Generator
A professional export engine that synthesizes complex findings into executive-ready **PDF, Markdown, or HTML reports** with embedded interactive visuals.

---

## 3. Core Integrated Services
- **AI Data Assistant Service**: LLM-driven natural language interface for querying raw databases directly.
- **Predictive Bottleneck Analysis**: Backend service that identifies performance or quality issues within datasets before they impact models.
- **Cloud-Sync & Integration Service**: Managed OAuth2 and API connectivity for continuous data synchronization between cloud providers and DataIQ.
- **Scheduled Audit & Quality Service**: CRON-based background service that performs recurring quality checks and schema-health validations on all stored assets.
- **Intelligent Export & Analytics Service**: A high-speed data transformation service for formatting and pushing processed results to external BI tools.

---

## 4. Database & Backend Logic (`/supabase`)
### A. Schema Evolution
- **V1 (Core)**: Users, Profiles, Subscriptions.
- **V2 (Data)**: `datasets` (with versioning), `columns`, `rows`.
- **Automation**: `workflow_rules` (Triggers/Conditions/Actions) and `event_log`.

### B. Stored Procedures & Logic
- **Triggers**: Auto-update `updated_at`, increment data access counts, and validate schema integrity.
- **Policies (RLS)**: Fine-grained security for multi-tenant data access.

### C. Edge Functions (11+ Deno Scripts)
- `connect-db`: Proxy for direct SQL connections.
- `ai-data-assistant`: LLM orchestration for data queries.
- `cloud-sync`: OAuth handling and background syncing for Google/Microsoft.
- `scheduled-analysis`: CRON-based audits of data quality.

---

## 5. Deployment & Operations
- **Frontend Port**: 8080 (or 5173 for dev)
- **ML Service Port**: 8002 (FastAPI)
- **Docker**: Root `docker-compose.yml` orchestrates the frontend, ML service, and (optional) local Postgres/Supabase.
- **Critical Environment Variables**:
  - `GOOGLE_API_KEY`: For Gemini orchestration.
  - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: Frontend-to-Backend connection.
  - `SUPABASE_SERVICE_ROLE_KEY`: Used by Edge Functions for administrative tasks.

---

## 6. Master Pivot Instructions
"Rebuild DataIQ as a high-performance analytics platform for data analysts. Use a Vite/React frontend with a premium Glassmorphism design. Use Supabase for real-time data orchestration and PostgreSQL's event system for automation. Implement the Python `ml-service` using LangGraph for multi-agent orchestration, focusing on automated data quality, model versioning, and AI-generated notebooks that allow researchers to 'chat' with their datasets while ensuring HIPAA-level PII anonymization."
