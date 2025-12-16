---
title: Lab-IQ ML Service
emoji: 🧬
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
short_description: AI-powered Multi-Agent AutoML for Biotech/Health
---

# Lab-IQ Multi-Agent AutoML Service

**Production-ready ML API specialized for Biotech/Health domain analysis**

## Features

- **Automated Data Profiling**: Instant quality assessment and statistics
- **Domain Detection**: Auto-detect Biotech, Clinical, and Chemistry datasets
- **Feature Engineering**: Smart recommendations for data preparation
- **Model Selection**: AI-powered algorithm recommendations
- **Real-time WebSocket**: Live progress updates during analysis
- **AI Insights**: Gemini/Groq-powered natural language insights

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| / | GET | Service info and capabilities |
| /health | GET | Health check |
| /api/ml/automl | POST | Run complete AutoML pipeline |
| /api/ml/quick-analysis | POST | Quick data analysis |
| /api/ml/insights | POST | Generate AI insights |
| /api/ml/chat | POST | Chat with AI assistant |

## Environment Variables (Set as Secrets)

- GEMINI_API_KEY: Google Gemini API key
- GROQ_API_KEY: Groq API key (fallback)

## Domain Support

- Biotech: DNA/RNA sequences, gene expression, protein analysis
- Clinical/Health: Patient data, vitals, diagnostics
- Chemistry: SMILES structures, molecular properties

## License

MIT License - Built for Lab-IQ Platform
