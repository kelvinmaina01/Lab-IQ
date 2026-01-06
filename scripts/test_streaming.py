import asyncio
import websockets
import json
import uuid

async def test_streaming():
    uri = "ws://localhost:5001/ws/generate-notebook"
    
    print(f"Connecting to {uri}...")
    try:
        # Standard connect without extra headers (CORS handled by server)
        async with websockets.connect(uri) as websocket:
            print("Connected! Sending request...")
            
            # Mock Request
            request_payload = {
                "user_prompt": "Analyze this data and find trends",
                "dataset_context": {"dataset_name": "Test Data", "columns": ["id", "value"]},
                "data_rows": [{"id": 1, "value": 10}, {"id": 2, "value": 20}]
            }
            
            await websocket.send(json.dumps(request_payload))
            
            print("Listening for events...")
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=60)
                    data = json.loads(message)
                    event_type = data.get("type")
                    
                    print(f"Received Event: [{event_type}]")
                    if event_type == "thought":
                        print(f"  Thought: {data.get('content')}")
                    elif event_type == "code":
                        print(f"  Code: {data.get('content')}")
                        print(f"  Snippet: {data.get('details', {}).get('python_code', '')[:50]}...")
                    elif event_type == "execution":
                        print(f"  Execution: {data.get('content')}")
                        print(f"  Logs: {data.get('logs', '')[:50]}...")
                    elif event_type == "complete":
                        print("COMPLETE! Payload received.")
                        break
                    elif event_type == "error":
                        print(f"ERROR: {data.get('error')}")
                        break
                        
                except asyncio.TimeoutError:
                    print("Timeout waiting for event")
                    break
                    
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_streaming())
