# Lab-IQ Multi-Agent AutoML System 🤖

## Overview

A powerful multi-agent system that automates end-to-end machine learning workflows. When you upload data and press "Process", this system handles everything:

- 🗂️ **Data Understanding** - Automatic profiling and quality assessment
- ⚙️ **Feature Engineering** - Intelligent feature creation and selection
- 🤖 **Model Selection** - Smart algorithm recommendations
- 🎯 **Hyperparameter Tuning** - Automated optimization
- 📊 **Model Training** - Cross-validation and ensemble creation
- 💡 **Insights Generation** - ML interpretability and recommendations

## Architecture

### 6 Specialized AI Agents

#### 1. Data Understanding Agent 🗂️
- Data type detection
- Missing value analysis
- Outlier detection
- Quality scoring
- Statistical summaries

#### 2. Feature Engineering Agent ⚙️
- Automatic feature generation (polynomial, interactions, aggregations)
- Feature selection (SelectKBest, Mutual Information)
- Categorical encoding (One-Hot, Label, Target encoding)
- Feature scaling and normalization
- Dimensionality reduction (PCA)

#### 3. Model Selection Agent 🤖
- Problem type detection (classification/regression/clustering)
- Dataset analysis (size, complexity, balance)
- Algorithm recommendations based on characteristics
- Support for 10+ algorithms

#### 4. Hyperparameter Optimization Agent 🎯
- Bayesian optimization with Optuna
- Random/Grid search fallback
- Algorithm-specific tuning
- Cross-validation during optimization

#### 5. Training & Evaluation Agent 📊
- Multiple algorithm training
- Cross-validation (5-fold)
- Ensemble model creation (Voting, Stacking)
- Comprehensive metrics:
  - Classification: Accuracy, Precision, Recall, F1, ROC-AUC
  - Regression: R², RMSE, MAE
  - Clustering: Silhouette, Davies-Bouldin

#### 6. Insights & Explanation Agent 💡
- Feature importance analysis
- Model performance insights
- Data quality recommendations
- Business-friendly explanations
- SHAP value support (optional)

### Orchestrator Agent 🎼
Coordinates all agents, manages workflow, tracks progress, and generates comprehensive reports.

## Supported Algorithms

### Classification
- **Random Forest Classifier** - Robust, handles non-linearity
- **XGBoost** - High performance, regularization
- **LightGBM** - Fast, efficient for large datasets
- **CatBoost** - Excellent for categorical features
- **Logistic Regression** - Fast, interpretable
- **SVM** - Effective for small-medium datasets
- **K-Nearest Neighbors** - Non-parametric, simple
- **Naive Bayes** - Fast, good for high dimensions

### Regression
- **Random Forest Regressor** - Robust to outliers
- **XGBoost Regressor** - State-of-the-art performance
- **LightGBM Regressor** - Very fast training
- **Linear Regression** - Simple, interpretable
- **Ridge Regression** - Handles multicollinearity
- **SVR** - Effective for small datasets

### Clustering
- **K-Means** - Fast, scalable
- **DBSCAN** - Density-based, finds arbitrary shapes
- **Gaussian Mixture** - Probabilistic clustering

## Quick Start

### 1. Install Dependencies

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Start the Service

```bash
python main.py
```

The service starts on `http://localhost:8002`

### 3. Use from Frontend

When you upload data and click "Process", it automatically:
1. Analyzes your data
2. Engineers features
3. Selects best algorithms
4. Trains multiple models
5. Generates insights
6. Provides downloadable report

## API Endpoints

### Complete AutoML Pipeline
```http
POST /api/ml/automl
Content-Type: application/json

{
  "dataset_id": "uuid",
  "data": [...],
  "target_column": "column_name",
  "problem_type": "classification"  // optional, auto-detected
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "pipeline_duration_seconds": 45.2,
    "data_summary": {
      "rows": 1000,
      "quality_score": 85.5,
      "quality_rating": "Good"
    },
    "model_training_summary": {
      "models_trained": 5,
      "best_model": "XGBoost",
      "best_score": 0.94
    },
    "key_findings": [...],
    "recommendations": [...]
  }
}
```

### Quick Data Analysis
```http
POST /api/ml/quick-analysis

{
  "dataset_id": "uuid",
  "data": [...]
}
```

### Real-time Progress (WebSocket)
```javascript
const ws = new WebSocket('ws://localhost:8002/ws/automl/dataset_id');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'progress') {
    console.log(`Progress: ${data.progress}%`);
  } else if (data.type === 'complete') {
    console.log('Pipeline complete!', data.result);
  }
};
```

## Output Examples

### Data Quality Report
```
📊 Data quality score: 87.5/100 (Good)
✅ Large dataset (5000 rows) - provides good statistical power.
📝 Moderate missing data (3.2%) - handled during preprocessing.
```

### Feature Engineering Report
```
Generated Features: 45
Selected Features: 32 (top 80%)
Top Feature: age_x_income (importance: 0.234)
Encoding: 
  - One-Hot: 3 categorical columns
  - Label: 2 high-cardinality columns
```

### Model Comparison
```
🏆 Winner: XGBoost (Accuracy: 94.2%)
Rankings:
1. XGBoost - 94.2%
2. Random Forest - 92.1%
3. Voting Ensemble - 93.5%
4. LightGBM - 91.8%
```

### Insights
```
🎯 Excellent performance! Test accuracy of 94.20% indicates high reliability.
✅ Model generalizes well - minimal gap between training and test accuracy.
⭐ Most Important Feature: customer_tenure (23.4%)
💡 Feature 'customer_tenure' is dominant. Investigate carefully.
🚀 Excellent performance - model is production-ready.
```

## Technology Stack

### Core ML
- scikit-learn - Core algorithms
- XGBoost - Gradient boosting
- LightGBM - Fast gradient boosting
- CatBoost - Categorical boosting
- Optuna - Hyperparameter optimization

### Feature Engineering
- featuretools - Automated feature engineering
- category_encoders - Advanced encoding

### Interpretability
- SHAP - Feature explanations
- LIME - Local interpretability

### Data Processing
- pandas - Data manipulation
- numpy - Numerical computing
- imbalanced-learn - Handling imbalanced data

### Visualization
- matplotlib, seaborn, plotly - Visualizations
- ydata-profiling - Data profiling
- sweetviz - EDA automation

### Framework
- FastAPI - High-performance API
- Pydantic - Data validation
- WebSockets - Real-time updates

## Performance

- **Small datasets** (<1000 rows): ~15-30 seconds
- **Medium datasets** (1K-10K rows): ~30-60 seconds
- **Large datasets** (10K-100K rows): ~1-5 minutes

## Features

### Automated
✅ Data quality assessment
✅ Missing value handling
✅ Outlier detection
✅ Feature generation
✅ Feature selection
✅ Model selection
✅ Hyperparameter tuning
✅ Cross-validation
✅ Ensemble creation
✅ Performance evaluation
✅ Insights generation

### Manual Control (Optional)
- Specify target column
- Set problem type
- Choose specific algorithms
- Custom hyperparameters
- Feature selection strategy

## Error Handling

The system gracefully handles:
- Missing values
- Infinite values
- Imbalanced classes
- Small datasets
- High dimensionality
- Mixed data types
- Outliers

## Monitoring

Track pipeline progress in real-time:
```python
GET /api/ml/pipeline-status/{dataset_id}

{
  "progress": 65,
  "current_stage": "Training & Evaluation",
  "agents": {
    "data_agent": "completed",
    "feature_agent": "completed",
    "model_selection_agent": "completed",
    "training_agent": "running"
  }
}
```

## Best Practices

1. **Data Quality**: Ensure reasonable data quality (>60 score)
2. **Sample Size**: Minimum 100 rows, 1000+ recommended
3. **Target Column**: For supervised learning, clearly define target
4. **Resources**: Allow sufficient time for large datasets
5. **Interpretation**: Review insights and recommendations carefully

## Troubleshooting

### Common Issues

**Installation fails:**
```bash
# Use specific compatible versions
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

**Memory errors:**
```python
# Reduce dataset size or use sampling
df_sample = df.sample(n=10000, random_state=42)
```

**Slow performance:**
- Limit algorithms to top 3
- Reduce hyperparameter search space
- Use faster algorithms (Logistic Regression, Linear models)

## Contributing

The multi-agent system is modular. To add new agents:

1. Create agent class inheriting from `BaseAgent`
2. Implement `execute()` method
3. Add to orchestrator pipeline
4. Update context sharing

## License

MIT License - See LICENSE file

## Support

For issues or questions, contact the Lab-IQ team or open an issue on GitHub.

---

**Built with ❤️ by the Lab-IQ Team**

*Powered by 6 specialized AI agents working together to automate your ML workflows*
