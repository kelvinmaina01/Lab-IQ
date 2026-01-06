# LabIQ Health V1 - MVP MISSION CONTROL

**Status**: PRE-DEPLOYMENT AUDIT
**Objective**: Hardening the codebase for production. No mocks. No fluff.

---

## 1. The Core Problem
Health data analysis is broken.
- **Researchers** are drowning in CSVs and Excel sheets they can't effectively query.
- **Analysts** are building fragile, manual pipelines that break easily.
- **Clinicians** are locked out of insights because tools require coding skills (Python/R).
- **Existing AI** is a "black box" — it gives answers without evidence, which is dangerous in health.

## 2. LabIQ Health V1 Goal
To provide a **self-driving data interface** where a user uploads raw data and gets scientific results automatically.
**V1 Success Definition**: A user uploads a dataset → The system *automatically* detects the domain, trains a model, and explains the findings in plain English.

---

## 3. Strict Feature Scope (IN vs OUT)
*To ensure a robust MVP, we are cutting thoroughly.*

### ✅ IN - Critical Path (Must work 100% real)
1.  **Auth System**: Login/Signup via Supabase (Split-screen UI).
2.  **Data Ingestion**: Upload CSV/Excel/JSON. System *must* parse and save to Supabase.
3.  **Event Bus & Rules**: The "Nervous System". `DATASET_UPLOADED` event *must* trigger downstream actions.
4.  **Scientific Workflows**: A simple state machine: Ingest → Profile → Train.
5.  **LabAI Assistant**: Chat interface that *can* query the dataset context (Analyst Mode).
6.  **Dashboards**: *Real* charts rendering data from the uploaded file.

### ✂️ OUT - Drop/De-prioritize for V1
1.  **Advanced Cloud Sync**: Drop the cron-job sync complexity. UI buttons can remain as "Connect", but deep 2-way sync is V2.
2.  **Complex Device Streams**: "Live" IoT device streaming is too high-risk for MVP. Keep file upload.
3.  **Multi-Modal AI**: Drop complex image/MRI analysis. Focus on tabular health data.
4.  **Team Collaboration**: Real-time cursor tracking/presence is nice but not critical. Async chat is enough.
5.  **Billing/Stripe**: Launch as Free/Beta. No payment gateways needed yet.

---

## 4. The "No-Mock" Audit Checklist
We will systematically verify these components are **NOT** mocked.

- [ ] **Data Upload**: Does `datasetService` actually write to Supabase?
- [ ] **Auth**: Does `AuthPage` actually create a Supabase session?
- [ ] **Event Bus**: Does `eventBus.emit()` actually trigger listeners?
- [ ] **ML Service**: Does the frontend actually call the Python API? (Critical Gap: We need to check if the Python backend is connected).
- [ ] **LabAI**: Is the chat responding with *real* context or hardcoded strings?

---
**Next Step**: Systematically audit the codebase against this checklist.
