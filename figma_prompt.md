# DataIQ: Master UI Prompt for Figma AI

Use the following detailed instructions to generate a high-fidelity, professional design for **DataIQ**, a premium AI-orchestrated data intelligence platform.

---

## 1. Global Visual Aesthetic
- **Style**: Modern, High-Focus, Enterprise Stealth-mode.
- **Theme**: Dark Mode base with **Glassmorphism**.
- **Materials**: Translucent cards (`rgba(30, 41, 59, 0.7)`), heavy backdrop-blur (20px-40px), and subtle micro-borders (`1px solid rgba(255, 255, 255, 0.1)`).
- **Colors**:
  - **Primary**: Deep Indigo (`#4F46E5`) to Cyan (`#06B6D4`) gradients.
  - **Secondary**: Violet (`#7C3AED`) to Fuchsia (`#C026D3`) gradients.
  - **Background**: Neutral Zinc-950 (`#09090b`).
  - **Foreground**: Pure White or high-contrast Zinc-100.
- **Radii**: 12px-16px (Rounded-xl) for cards and interactive elements.

---

## 2. Core Layout Architecture
- **Sidebar**: Fixed-left (256px), collapsible. Glass material. 
  - *Logo area*: Gradient icon (HeartPulse) + "DataIQ" in geometric sans-serif.
  - *Nav Items*: Data Ingestion, Datasets, AI Analysis, Command Center, Analytics, Models, Experiments, Automation, Reports.
- **TopBar**: Horizontal, sticky. Contains Global Search (CMD+K), Notification Bell (with red dot), and a "Lab Profile" circle selector with status glow.
- **Main Viewport**: Centered content area with 32px padding, fluidly resizing between 1200px and 1400px.

---

## 3. Specialized Design Components

### A. The "Intelligence" Dashboard (Command Center)
- **MetricCards**: Group of 4 top-row cards. Each has a large numerical value, a 28px icon in the top-right (Indigo/Purple/Green/Orange), a progress-percentage trend, and a sub-label (e.g., "5 / 10 limit").
- **PredictiveInsightCard**: A double-width card with a subtle animated gradient border. Displays a text insight ("Predictive spike detected in Dataset X") plus a sparkline chart.
- **UsageCards**: Mini-cards with horizontal progress bars for "Storage MB," "AI Credits," and "Data Slot" usage.
- **ActivityFeed**: A vertical list on the right. Items show a timestamp, a small system icon (Database/Brain), and a two-line text summary.

### B. AI Notebook Interface (`Analysis`)
- **Cell Structure**: A vertical feed of nested components:
  1. **Prompt cell**: Dark input field with "Ask anything..." placeholder.
  2. **Reasoning cell**: Translucent area showing "AI Thought Process" steps with loading checkmarks.
  3. **Data cell**: Interactive Recharts chart (Area/Bar) or a sleek Table with sortable headers.
  4. **Summary cell**: Text block using Markdown for bold/highlighted insights.

### C. Data Ingestion Hub (`Upload`)
- **Connection Grid**: Large square cards for data sources (Postgres, Google Sheets, etc.). Each shows a large color-logo, a badge for status (Connected/Syncing), and a "Sync Frequency" indicator.
- **Metadata Drawer**: Slides out from the right when a dataset is clicked. Shows "Quality Score" (Gauge chart), "Missingness" (Heatmap bar), and "PII Detection" tags (Locked/Unlocked icons).

---

## 4. UI Library Specifics
- **Typography**: Primary font is **Inter** or **Geist Sans**. Use 500/600/700 weights for headers.
- **Shadows**: Large, soft shadows with low opacity indigo tints (`box-shadow: 0px 10px 30px rgba(79, 70, 229, 0.1)`).
- **Empty States**: Minimalist illustrations (empty laboratory beaker or database cylinder) with a "Connect First Source" primary button.

---

## 5. Interaction Patterns
- **Hover States**: 105% scale on cards, glow effect on icons, and border-color shifts.
- **Floating Assistant**: A circular button in the bottom-right corner that expands into a 400px wide "LabAI Chat" overlay with Generative UI components.
- **Progressive Disclosure**: Detailed stats tucked behind "View Drill-down" arrows on dashboard cards.
