"""
Quick test to see if multi-agent actually works
"""
import os
import sys
sys.path.insert(0, '.')

# Set API keys
os.environ['GEMINI_API_KEY'] = 'AIzaSyDVkM8IJqyAB44mihL1_KZozs5ABPDzrvs'
os.environ['GROQ_API_KEY'] = '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'

print("=== Testing Multi-Agent Import ===")
try:
    from lab_iq.multi_agent import get_debate_insights
    print("✅ Import successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n=== Testing Multi-Agent Call ===")
try:
    stats = {
        'row_count': 5,
        'column_count': 3,
        'columns': ['product_id', 'sales', 'date']
    }
    
    result = get_debate_insights("What are the key trends?", stats, "chat")
    
    print(f"✅ Call successful")
    print(f"Summary: {result['summary'][:100]}...")
    print(f"Insights count: {len(result['insights'])}")
    print(f"Suggestions count: {len(result['suggestions'])}")
    
    if "Error" in result['summary']:
        print(f"⚠️  Response contains error: {result['summary']}")
    
except Exception as e:
    print(f"❌ Call failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ ALL TESTS PASSED")
