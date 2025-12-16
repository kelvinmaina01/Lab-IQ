# 🚀 Lab-IQ Research Implementation Plan
## Strategic Roadmap Based on Market Analysis

> **Source:** `.agent/heavy_research` analysis
> **Date:** December 2025
> **Status:** Ready for Implementation

---

## 📋 Executive Summary

This plan addresses **4 critical strategic gaps** identified through competitive analysis:
1. Integration Reality Gap (Manual → Automated)
2. Black Box Trust Barrier (Need Explainable AI)
3. Generalist Trap (Focus → Biotech/Pharma niche)
4. Freemium Unit Economics (Cost optimization)

---

## 🎯 Phase 1: Critical Infrastructure (Week 1-2)
### Priority: IMMEDIATE - Foundation for Everything

### 1.1 Migrate ML Service to Hugging Face Spaces
**Problem:** Render Free Tier = 512MB RAM (crashes on import tensorflow)
**Solution:** Hugging Face Spaces = 16GB Free RAM

#### Implementation Steps:
```bash
# 1. Create HF Space
- Go to huggingface.co
- Create new Space: "lab-iq-ml"
- SDK: Docker
- Port: 7860

# 2. Optimize requirements.txt
```

**New `ml-service/requirements.txt`:**
```plaintext
# Core API
fastapi==0.115.5
uvicorn[standard]==0.32.1
python-multipart==0.0.6
python-dotenv==1.0.1
pydantic==2.10.1

# Data Manipulation
numpy==1.26.4
pandas==2.2.3
scipy==1.13.1

# ML (CPU Optimized) - NO TensorFlow/PyTorch
scikit-learn==1.5.2
xgboost==2.1.3
lightgbm==4.5.0
imbalanced-learn==0.12.4
joblib==1.4.2

# Optimization
optuna==4.1.0

# Database
supabase==2.10.0

# AI Reasoning (API-based, not local)
google-generativeai==0.8.3
langchain==0.3.9
langchain-google-genai==2.0.6

# Visualization (Static only)
matplotlib==3.9.2
seaborn==0.13.2
```

**Weight Savings:**
- ❌ Dropped: TensorFlow (~500MB), PyTorch (~800MB), transformers
- ✅ Kept: Scikit-Learn, XGBoost, LightGBM (covers 95% of lab data)

**New `ml-service/Dockerfile`:**
```dockerfile
FROM python:3.9-slim

# Install system dependencies for ML libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Setup non-root user (HF requirement)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy requirements
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy app code
COPY --chown=user . /app

# Create temp directory for models
RUN mkdir -p /app/temp_models

# Expose HF port
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

**Update `ml-service/main.py`:**
```python
from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from agents.orchestrator import OrchestratorAgent

app = FastAPI()
orchestrator = OrchestratorAgent()

@app.post("/api/ml/automl")
async def start_automl(
    background_tasks: BackgroundTasks,  # Replace Celery
    dataset_id: str,
    target_column: str
):
    """Start AutoML in background (no Celery/Redis needed)"""

    background_tasks.add_task(
        orchestrator.execute,
        dataset_id=dataset_id,
        target_column=target_column
    )

    return {
        "status": "queued",
        "message": "AutoML started",
        "dataset_id": dataset_id
    }
```

#### Files to Create:
- `ml-service/Dockerfile` (optimized for HF)
- `ml-service/requirements.txt` (stripped down)
- `ml-service/agents/storage_agent.py` (upload to Supabase)

**Success Criteria:**
- ✅ ML service runs on HF without crashes
- ✅ API accessible at `https://huggingface.co/spaces/YOUR_USERNAME/lab-iq-ml`
- ✅ Frontend connects successfully

---

### 1.2 Model Storage to Supabase
**Problem:** HF Spaces restart → models lost
**Solution:** Upload trained models to Supabase Storage immediately

**New File: `ml-service/agents/storage_agent.py`:**
```python
from supabase import create_client
import joblib
import os

class StorageAgent:
    def __init__(self):
        self.supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

    async def upload_model(self, model, model_id: str):
        """Upload trained model to Supabase Storage"""

        # Save locally first
        local_path = f"/app/temp_models/{model_id}.pkl"
        joblib.dump(model, local_path)

        # Upload to Supabase
        with open(local_path, 'rb') as f:
            self.supabase.storage.from_('models').upload(
                f"{model_id}.pkl",
                f,
                file_options={"content-type": "application/octet-stream"}
            )

        # Clean up local file
        os.remove(local_path)

        return f"models/{model_id}.pkl"

    async def download_model(self, model_id: str):
        """Download model from Supabase for inference"""

        # Download from Supabase
        res = self.supabase.storage.from_('models').download(f"{model_id}.pkl")

        # Save locally
        local_path = f"/app/temp_models/{model_id}.pkl"
        with open(local_path, 'wb') as f:
            f.write(res)

        # Load and return model
        model = joblib.load(local_path)
        os.remove(local_path)

        return model
```

**Success Criteria:**
- ✅ Models persist across HF restarts
- ✅ Can download models for inference
- ✅ Supabase storage bucket created

---

## 🔬 Phase 2: Trust & Compliance (Week 3-4)
### Priority: HIGH - Required for Pharma Sales

### 2.1 Add SHAP/LIME Explainability
**Problem:** Scientists need to know WHY AI made a prediction
**Solution:** Visual interpretability with SHAP plots

**Add to `ml-service/requirements.txt`:**
```plaintext
shap==0.45.1
lime==0.2.0.1
```

**New File: `ml-service/agents/explainability_agent.py`:**
```python
import shap
import lime.lime_tabular
import matplotlib.pyplot as plt
import base64
from io import BytesIO

class ExplainabilityAgent:
    def generate_shap_plot(self, model, X_train, X_test):
        """Generate SHAP feature importance plot"""

        explainer = shap.Explainer(model, X_train)
        shap_values = explainer(X_test)

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 6))
        shap.plots.waterfall(shap_values[0], show=False)

        # Convert to base64 for frontend
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode()
        plt.close()

        return f"data:image/png;base64,{img_base64}"

    def generate_lime_explanation(self, model, X_train, instance):
        """Generate LIME local explanation for single prediction"""

        explainer = lime.lime_tabular.LimeTabularExplainer(
            X_train.values,
            mode='regression',
            feature_names=X_train.columns
        )

        exp = explainer.explain_instance(instance, model.predict)

        # Get feature contributions
        contributions = dict(exp.as_list())

        return {
            "features": contributions,
            "prediction": float(model.predict([instance])[0])
        }
```

**Update `ml-service/agents/insights_agent.py`:**
```python
from agents.explainability_agent import ExplainabilityAgent

class InsightsAgent:
    def __init__(self):
        self.explainability = ExplainabilityAgent()

    async def generate_insights(self, model, X_train, X_test, y_test):
        """Generate insights with explainability"""

        # Get SHAP plot
        shap_plot = self.explainability.generate_shap_plot(
            model, X_train, X_test
        )

        # Get feature importance
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(
                X_train.columns,
                model.feature_importances_
            ))
        else:
            feature_importance = {}

        return {
            "shap_plot": shap_plot,
            "feature_importance": feature_importance,
            "model_performance": {
                "r2_score": r2_score(y_test, model.predict(X_test)),
                "rmse": mean_squared_error(y_test, model.predict(X_test), squared=False)
            }
        }
```

**Frontend Update: `src/pages/Insights.tsx`:**
```tsx
// Add SHAP visualization
{insight.shap_plot && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Feature Importance (SHAP)</h3>
    <img
      src={insight.shap_plot}
      alt="SHAP Plot"
      className="w-full rounded-lg border"
    />
    <p className="text-sm text-muted-foreground">
      This shows which features had the biggest impact on predictions.
      Red bars push predictions higher, blue bars push them lower.
    </p>
  </div>
)}
```

**Success Criteria:**
- ✅ SHAP plots generated for all models
- ✅ Feature importance visualized
- ✅ "Why this prediction?" explanation available

---

### 2.2 Build Audit Trail System
**Problem:** Pharma needs 21 CFR Part 11 compliance
**Solution:** Log every action with timestamp + user

**Database Schema Update: `DATABASE_AUDIT_SETUP.sql`:**
```sql
-- Audit Trail Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL, -- 'upload', 'train', 'predict', 'delete'
  resource_type VARCHAR(50) NOT NULL, -- 'dataset', 'model', 'experiment'
  resource_id UUID,
  details JSONB, -- Store action details
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_resource (resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);
```

**New File: `src/lib/services/auditService.ts`:**
```typescript
import { supabase } from '@/lib/supabase';

export class AuditService {
  static async log(
    actionType: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    });
  }

  static async getClientIP(): Promise<string> {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  static async getAuditTrail(resourceType?: string, resourceId?: string) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
}
```

**Usage Examples:**
```typescript
// Log dataset upload
await AuditService.log('upload', 'dataset', datasetId, {
  filename: file.name,
  size: file.size,
  rows: rowCount
});

// Log model training
await AuditService.log('train', 'model', modelId, {
  algorithm: 'XGBoost',
  target_column: 'yield',
  accuracy: 0.95
});

// Log prediction
await AuditService.log('predict', 'model', modelId, {
  num_predictions: predictions.length
});
```

**New Page: `src/pages/AuditTrail.tsx`:**
```tsx
import { useEffect, useState } from 'react';
import { AuditService } from '@/lib/services/auditService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuditTrail = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    const data = await AuditService.getAuditTrail();
    setLogs(data);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Audit Trail</h1>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge>{log.action_type}</Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  {log.resource_type}: {log.resource_id}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            {log.details && (
              <pre className="mt-2 text-xs bg-muted p-2 rounded">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
```

**Success Criteria:**
- ✅ Every action logged with timestamp
- ✅ Audit trail page shows all activity
- ✅ Can filter by resource type/ID
- ✅ Export audit logs to CSV

---

## 🔌 Phase 3: Integration Automation (Week 5-6)
### Priority: MEDIUM - Removes Manual Friction

### 3.1 Build Watch Folder Agent
**Problem:** Scientists manually drag-drop files
**Solution:** Agent watches folder, auto-uploads new files

**New File: `watch-folder-agent/index.js`:**
```javascript
const chokidar = require('chokidar');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class WatchFolderAgent {
  constructor(watchPath) {
    this.watchPath = watchPath;
    this.watcher = null;
  }

  start() {
    console.log(`Watching folder: ${this.watchPath}`);

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => console.error('Watch error:', error));
  }

  async handleNewFile(filePath) {
    try {
      console.log(`New file detected: ${filePath}`);

      // Read file
      const fileContent = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('datasets')
        .upload(`auto-uploaded/${fileName}`, fileContent, {
          contentType: this.getMimeType(fileName)
        });

      if (error) throw error;

      // Create dataset record
      await supabase.from('datasets').insert({
        name: fileName,
        file_path: data.path,
        upload_source: 'watch_folder',
        status: 'uploaded'
      });

      console.log(`✅ Uploaded: ${fileName}`);

    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.json': 'application/json',
      '.xml': 'application/xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}

// Usage
const agent = new WatchFolderAgent(process.env.WATCH_PATH || '/path/to/watch');
agent.start();
```

**`watch-folder-agent/package.json`:**
```json
{
  "name": "lab-iq-watch-agent",
  "version": "1.0.0",
  "dependencies": {
    "chokidar": "^3.6.0",
    "@supabase/supabase-js": "^2.45.0",
    "dotenv": "^16.4.5"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

**Electron App (Optional - For Desktop)**
```javascript
// To package as desktop app
const { app, BrowserWindow, Tray, Menu } = require('electron');

// System tray icon that runs in background
// User can configure watch folder via UI
// Shows notifications when files uploaded
```

**Success Criteria:**
- ✅ Agent watches specified folder
- ✅ Auto-uploads new CSV/Excel/JSON files
- ✅ Creates dataset records automatically
- ✅ Shows upload notifications

---

### 3.2 API Connectors for Instruments
**Problem:** Scientists export data from instruments manually
**Solution:** Direct API connections to common lab instruments

**New File: `ml-service/integrations/instrument_connectors.py`:**
```python
from abc import ABC, abstractmethod
import requests
from datetime import datetime

class InstrumentConnector(ABC):
    """Base class for all instrument connectors"""

    @abstractmethod
    async def fetch_data(self, instrument_id: str):
        pass

class MassSpectrometerConnector(InstrumentConnector):
    """Connect to mass spectrometer via REST API"""

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key

    async def fetch_data(self, instrument_id: str):
        """Fetch latest run data"""

        response = requests.get(
            f"{self.api_url}/instruments/{instrument_id}/runs/latest",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )

        if response.status_code != 200:
            raise Exception(f"Failed to fetch data: {response.text}")

        return response.json()

class ChromatographConnector(InstrumentConnector):
    """Connect to HPLC/GC via vendor API"""

    async def fetch_data(self, instrument_id: str):
        # Vendor-specific implementation
        pass

class PlateReaderConnector(InstrumentConnector):
    """Connect to plate reader (e.g., Tecan, BMG)"""

    async def fetch_data(self, instrument_id: str):
        # Vendor-specific implementation
        pass
```

**Success Criteria:**
- ✅ Connectors for top 3 instrument types
- ✅ Scheduled data pulls (every hour)
- ✅ Error handling + retries
- ✅ Data automatically uploaded to Lab-IQ

---

## 📊 Phase 4: Value Prop Refinement (Week 7)
### Priority: MEDIUM - Marketing & Positioning

### 4.1 Update Landing Page Copy
**Old:** "Analyze any data in minutes"
**New:** "The Audit-Ready AI Analyst"

**Update `src/pages/Index.tsx`:**
```tsx
<h1>The Audit-Ready AI Analyst</h1>
<p>
  Enterprise-grade AI with full explainability and compliance.
  Trusted by Pharma, trusted by the FDA.
</p>
```

### 4.2 Add "Technical Trust" Section
**New Section on Landing Page:**
```tsx
<section>
  <h2>Built for Regulatory Approval</h2>
  <div className="grid md:grid-cols-3 gap-8">
    <div>
      <ShieldCheck className="w-12 h-12" />
      <h3>21 CFR Part 11 Compliant</h3>
      <p>Full audit trail, electronic signatures, data integrity</p>
    </div>
    <div>
      <Eye className="w-12 h-12" />
      <h3>Explainable AI</h3>
      <p>SHAP/LIME visualizations show exactly why AI made each prediction</p>
    </div>
    <div>
      <FileCheck className="w-12 h-12" />
      <h3>Validation Reports</h3>
      <p>Auto-generated reports for regulatory submission</p>
    </div>
  </div>
</section>
```

---

## 🎯 Phase 5: Niche Domination (Week 8-12)
### Priority: STRATEGIC - Focus on Biotech/Pharma

### 5.1 Biotech-Specific Features
**Why Biotech First?**
- Your stack (RDKit, BioPython) is strongest here
- Less legal risk than Clinical (HIPAA)
- Less specialized physics than Materials

**Add to requirements.txt:**
```plaintext
rdkit==2023.9.6
biopython==1.84
chembl-webresource-client==0.10.8
```

**New Features:**
1. **Molecular Structure Analysis**
2. **Protein Folding Predictions**
3. **Drug-Target Interaction Scoring**
4. **QSAR Model Building**
5. **Bioactivity Prediction**

**New File: `ml-service/agents/biotech_agent.py`:**
```python
from rdkit import Chem
from rdkit.Chem import Descriptors
import Bio.PDB

class BiotechAgent:
    def analyze_molecule(self, smiles: str):
        """Analyze molecular properties"""

        mol = Chem.MolFromSmiles(smiles)

        return {
            "molecular_weight": Descriptors.MolWt(mol),
            "logp": Descriptors.MolLogP(mol),
            "num_h_donors": Descriptors.NumHDonors(mol),
            "num_h_acceptors": Descriptors.NumHAcceptors(mol),
            "tpsa": Descriptors.TPSA(mol),
            "lipinski_violations": self.check_lipinski(mol)
        }

    def check_lipinski(self, mol):
        """Check Lipinski's Rule of Five"""
        violations = []

        if Descriptors.MolWt(mol) > 500:
            violations.append("MW > 500")
        if Descriptors.MolLogP(mol) > 5:
            violations.append("LogP > 5")
        if Descriptors.NumHDonors(mol) > 5:
            violations.append("H-donors > 5")
        if Descriptors.NumHAcceptors(mol) > 10:
            violations.append("H-acceptors > 10")

        return violations
```

---

## 💰 Phase 6: Unit Economics Fix (Week 13-14)
### Priority: HIGH - Prevent Cost Explosion

### 6.1 Restrict Free Tier Compute
**Problem:** 10,000 free users × AutoML = bankruptcy
**Solution:** Strict limits on free tier

**Database Schema: `subscription_limits` table:**
```sql
CREATE TABLE subscription_limits (
  tier VARCHAR(20) PRIMARY KEY,
  max_datasets INT,
  max_models INT,
  monthly_predictions INT,
  max_compute_minutes INT, -- NEW!
  max_storage_gb INT
);

INSERT INTO subscription_limits VALUES
('free', 3, 1, 100, 10, 1),  -- Only 10 compute minutes/month
('pro', 50, 10, 10000, 500, 50),
('enterprise', -1, -1, -1, -1, -1);
```

**Update Training Logic:**
```python
class OrchestratorAgent:
    async def execute(self, dataset_id, target_column):
        # Check compute limits
        user_usage = await self.get_user_compute_usage(user_id)
        user_limits = await self.get_user_limits(user_id)

        if user_usage.compute_minutes >= user_limits.max_compute_minutes:
            raise Exception("Compute limit reached. Upgrade to Pro.")

        # Track compute time
        start_time = time.time()

        # ... train model ...

        compute_minutes = (time.time() - start_time) / 60

        # Log usage
        await self.log_compute_usage(user_id, compute_minutes)
```

**Free Tier Strategy:**
```python
# Free users get pre-trained models only
if user.tier == 'free':
    # Use pre-trained model from model zoo
    model = await self.get_pretrained_model(task_type)
else:
    # Custom AutoML training
    model = await self.train_custom_model(X, y)
```

---

## 📈 Success Metrics

### Phase 1 (Infrastructure)
- [ ] ML service running on HF Spaces (16GB RAM)
- [ ] Models persisting in Supabase Storage
- [ ] Frontend connects to HF API successfully
- [ ] No OOM crashes

### Phase 2 (Trust)
- [ ] SHAP plots generated for all models
- [ ] Audit trail logging all actions
- [ ] Audit trail page accessible
- [ ] Export audit logs to CSV

### Phase 3 (Integration)
- [ ] Watch folder agent running
- [ ] Auto-uploads working
- [ ] At least 1 instrument connector built
- [ ] Scheduled data pulls working

### Phase 4 (Positioning)
- [ ] Landing page updated with "Audit-Ready" messaging
- [ ] Technical trust section added
- [ ] Competitor analysis slide in deck

### Phase 5 (Niche)
- [ ] RDKit/BioPython integrated
- [ ] Molecular analysis working
- [ ] Biotech landing page created
- [ ] First Biotech customer signed

### Phase 6 (Economics)
- [ ] Compute limits enforced
- [ ] Pre-trained models for free users
- [ ] Usage tracking implemented
- [ ] Unit economics sustainable

---

## 🚨 Critical Paths (Must Do First)

### Week 1 (Critical):
1. ✅ Migrate ML service to HF Spaces
2. ✅ Strip down requirements.txt
3. ✅ Add model storage to Supabase

### Week 2 (Critical):
4. ✅ Add SHAP/LIME explainability
5. ✅ Build audit trail system

### Week 3-4 (Important):
6. ⚠️ Add watch folder agent
7. ⚠️ Update landing page copy

### Week 5-12 (Strategic):
8. 🎯 Focus on Biotech niche
9. 🎯 Add biotech-specific features

### Week 13-14 (Economics):
10. 💰 Implement compute limits
11. 💰 Add pre-trained model zoo

---

## 🎯 North Star Metrics

### Product-Market Fit:
- **Week 4:** 5 beta users testing explainability features
- **Week 8:** 1 Biotech/Pharma customer paying
- **Week 12:** 10 paying customers (focused on Biotech)
- **Week 16:** $5K MRR

### Unit Economics:
- **Free Tier:** <$0.10 per user per month (compute cost)
- **Pro Tier:** >$50/mo revenue per user
- **LTV:CAC Ratio:** >3:1

---

## 📚 Resources Needed

### Development:
- Hugging Face Spaces account (free)
- Supabase Storage bucket for models
- SHAP/LIME Python libraries
- RDKit/BioPython libraries (biotech features)

### Testing:
- 5 beta users from Biotech sector
- Sample datasets (molecular, protein, bioactivity)
- Test instruments for API connector

### Marketing:
- Updated pitch deck with "Audit-Ready" positioning
- Case study: 1 Biotech customer success story
- Blog post: "Why Explainable AI Matters in Drug Discovery"

---

## 🎬 Next Immediate Action

**RIGHT NOW (This Week):**
1. Create Hugging Face Space
2. Deploy stripped-down ML service
3. Test model training on HF
4. Implement model upload to Supabase

**Would you like me to start implementing Phase 1 right now?**

---

**Last Updated:** December 2025
**Status:** ✅ Ready for Implementation
**Estimated Timeline:** 14 weeks to Phase 6 completion
