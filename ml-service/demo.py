"""
Demo script to test the Multi-Agent AutoML System
"""
import asyncio
import pandas as pd
from agents.orchestrator import OrchestratorAgent


async def demo_classification():
    """Demo with Iris dataset"""
    print("\n" + "=" * 70)
    print("DEMO 1: Classification - Iris Dataset")
    print("=" * 70)
    
    # Load sample data
    from sklearn.datasets import load_iris
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['species'] = iris.target
    
    # Convert to dict format
    data = df.to_dict('records')
    
    # Create context
    context = {
        "dataset_id": "iris_demo",
        "target_column": "species",
        "problem_type": "classification"
    }
    
    # Run AutoML
    orchestrator = OrchestratorAgent()
    result = await orchestrator.execute(data, context)
    
    # Print summary
    if result.get("success"):
        summary = result.get("summary", {})
        print("\n" + "-" * 70)
        print("RESULTS SUMMARY")
        print("-" * 70)
        print(f"Duration: {summary.get('pipeline_duration_seconds', 0):.2f} seconds")
        print(f"\nData Quality: {summary.get('data_summary', {}).get('quality_score', 0):.1f}/100")
        print(f"Best Model: {summary.get('model_training_summary', {}).get('best_model')}")
        print(f"Best Score: {summary.get('model_training_summary', {}).get('best_score', 0):.4f}")
        
        print("\nKey Findings:")
        for finding in summary.get('key_findings', [])[:5]:
            print(f"  • {finding}")
        
        print("\nTop Recommendations:")
        for rec in summary.get('recommendations', [])[:5]:
            print(f"  • {rec}")
    else:
        print(f"❌ Pipeline failed: {result.get('error')}")


async def demo_regression():
    """Demo with Boston Housing dataset"""
    print("\n" + "=" * 70)
    print("DEMO 2: Regression - California Housing Dataset")
    print("=" * 70)
    
    # Load sample data
    from sklearn.datasets import fetch_california_housing
    housing = fetch_california_housing()
    df = pd.DataFrame(housing.data, columns=housing.feature_names)
    df['price'] = housing.target
    
    # Take a sample for faster demo
    df = df.sample(n=500, random_state=42)
    
    # Convert to dict format
    data = df.to_dict('records')
    
    # Create context
    context = {
        "dataset_id": "housing_demo",
        "target_column": "price",
        "problem_type": "regression"
    }
    
    # Run AutoML
    orchestrator = OrchestratorAgent()
    result = await orchestrator.execute(data, context)
    
    # Print summary
    if result.get("success"):
        summary = result.get("summary", {})
        print("\n" + "-" * 70)
        print("RESULTS SUMMARY")
        print("-" * 70)
        print(f"Duration: {summary.get('pipeline_duration_seconds', 0):.2f} seconds")
        print(f"\nData Quality: {summary.get('data_summary', {}).get('quality_score', 0):.1f}/100")
        print(f"Best Model: {summary.get('model_training_summary', {}).get('best_model')}")
        print(f"Best R² Score: {summary.get('model_training_summary', {}).get('best_score', 0):.4f}")
        
        print("\nKey Findings:")
        for finding in summary.get('key_findings', [])[:5]:
            print(f"  • {finding}")
    else:
        print(f"❌ Pipeline failed: {result.get('error')}")


async def demo_auto_detect():
    """Demo with auto problem type detection"""
    print("\n" + "=" * 70)
    print("DEMO 3: Auto Detection - Wine Dataset")
    print("=" * 70)
    
    # Load sample data
    from sklearn.datasets import load_wine
    wine = load_wine()
    df = pd.DataFrame(wine.data, columns=wine.feature_names)
    df['quality'] = wine.target
    
    # Convert to dict format
    data = df.to_dict('records')
    
    # Create context WITHOUT specifying problem type
    context = {
        "dataset_id": "wine_demo",
        "target_column": "quality"
        # No problem_type - let it auto-detect!
    }
    
    # Run AutoML
    orchestrator = OrchestratorAgent()
    result = await orchestrator.execute(data, context)
    
    # Print summary
    if result.get("success"):
        summary = result.get("summary", {})
        print("\n" + "-" * 70)
        print("RESULTS SUMMARY")
        print("-" * 70)
        print(f"Detected Problem Type: {summary.get('problem_type')}")
        print(f"Duration: {summary.get('pipeline_duration_seconds', 0):.2f} seconds")
        print(f"\nBest Model: {summary.get('model_training_summary', {}).get('best_model')}")
        print(f"Best Score: {summary.get('model_training_summary', {}).get('best_score', 0):.4f}")
    else:
        print(f"❌ Pipeline failed: {result.get('error')}")


async def main():
    """Run all demos"""
    print("\n" + "=" * 70)
    print("🤖 Lab-IQ Multi-Agent AutoML System - Demo")
    print("=" * 70)
    print("\nThis demo will test the complete AutoML pipeline with:")
    print("  1. Classification (Iris)")
    print("  2. Regression (California Housing)")
    print("  3. Auto-detection (Wine)")
    print("\n")
    
    try:
        # Run demos
        await demo_classification()
        await demo_regression()
        await demo_auto_detect()
        
        print("\n" + "=" * 70)
        print("✅ All demos completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Run async main
    asyncio.run(main())
