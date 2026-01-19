"""
Test Script for Data Quality Framework (Direct Agent Test)
- Tests Logic Consistency (Male + Pregnant)
- Tests Biological Range Checks (BP > 300)
- Tests Isolation Forest Anomaly Detection
- Tests AI Imputation
"""
import asyncio
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.data_agent import DataAgent
from agents.domain_agent import DomainAgent
from agents.feature_agent import FeatureEngineeringAgent

async def main():
    print("="*60)
    print("TESTING DATA QUALITY FRAMEWORK (UNIT)")
    print("="*60)
    
    # Create synthetic dataset with known issues
    data = {
        'patient_id': range(1, 21),
        'gender': ['Male'] * 10 + ['Female'] * 10,
        'pregnancy_status': ['Yes'] * 2 + ['No'] * 8 + ['Yes', 'No'] * 5, # 2 Males are pregnant (Logic Error)
        'vital_bp': np.random.normal(120, 10, 20).tolist(),
        'vital_temp': np.random.normal(37, 0.5, 20).tolist(),
        'age': np.random.randint(20, 80, 20).tolist()
    }
    
    df = pd.DataFrame(data)
    
    # Introduce Biological Range Error
    df.loc[5, 'vital_bp'] = 500  # Impossible BP
    
    # Introduce Statistical Outlier (multivariate)
    # A person with very high temp but very low BP (unusual combo)
    df.loc[15, 'vital_temp'] = 42
    df.loc[15, 'vital_bp'] = 60
    
    # Introduce Missing Values for Imputation
    df.loc[0:5, 'age'] = np.nan # 25% missing
    
    print("\n[1] Synthetic Data Created")
    
    # Mock context
    context = {
        "dataset_id": "test_dataset",
        "target_column": "vital_bp", 
        "problem_type": "regression"
    }

    print("\n[2] Running Agents Directly...")
    
    # --- DOMAIN AGENT (Logic Checks) ---
    print("\n[2.1] Testing DomainAgent...")
    domain_agent = DomainAgent()
    domain_result = await domain_agent.execute(df.to_dict('records'), context)
    
    consistency = domain_result.get('consistency_issues', [])
    range_violations = domain_result.get('range_violations', [])
    
    print(f"Logic Consistency Checks:")
    if consistency:
        print("✅ SUCCESS: Detected Logic Errors!")
        for issue in consistency:
            print(f"   - {issue}")
    else:
        print("❌ FAILED: Did not detect Logic Errors")
        
    print(f"Biological Range Checks:")
    if range_violations:
        print("✅ SUCCESS: Detected Range Violations!")
        for issue in range_violations:
            print(f"   - {issue}")
    else:
        print("❌ FAILED: Did not detect Range Violations")

    # --- DATA AGENT (Anomaly Detection) ---
    print("\n[2.2] Testing DataAgent...")
    data_agent = DataAgent()
    # DataAgent calls DomainAgent internally
    
    data_result = await data_agent.execute(df.to_dict('records'), context)
    
    anomalies = data_result.get('anomaly_classification', {})
    
    print(f"AI Anomaly Detection (Isolation Forest):")
    if anomalies.get('ai_detected_count', 0) > 0:
        print(f"✅ SUCCESS: Detected {anomalies.get('ai_detected_count')} multivariate anomalies")
    else:
        print("❌ FAILED: Did not detect anomalies")

    # --- FEATURE AGENT (Imputation) ---
    print("\n[2.3] Testing FeatureEngineeringAgent...")
    feature_agent = FeatureEngineeringAgent()
    feature_result = await feature_agent.execute(df.to_dict('records'), context)
    
    missing_report = feature_result.get('missing_report', {})
    strategies = missing_report.get('strategies', {})
    
    print(f"AI Imputation:")
    if 'age' in strategies and "IterativeImputer" in strategies['age']:
        print("✅ SUCCESS: Used AI-based IterativeImputer for age")
    else:
        print(f"⚠️ NOTE: Strategy used for age: {strategies.get('age', 'None')}")
        
    print("\n" + "="*60)

if __name__ == "__main__":
    asyncio.run(main())
