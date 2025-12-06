"""
Content Generation Agent - Uses Gemini API for text generation
"""
import os
import requests
import logging
from typing import Dict, Any, Optional
from .base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ContentAgent(BaseAgent):
    """Agent responsible for generating text content using Gemini"""
    
    def __init__(self):
        super().__init__("content_agent", "Content Generation Agent 📝")
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate content based on prompt
        """
        if not self.api_key:
            return {"error": "GEMINI_API_KEY not found in environment variables"}
        
        prompt = data.get("prompt")
        system_instruction = data.get("system_instruction", "You are a helpful AI assistant for a laboratory management system.")
        
        if not prompt:
            return {"error": "No prompt provided"}
            
        try:
            # Construct payload for Gemini API
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_instruction}\n\nUser Request: {prompt}"}]
                }]
            }
            
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.text}")
                return {"error": f"API Error: {response.status_code}", "details": response.text}
                
            result = response.json()
            generated_text = result.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
            
            return {
                "generated_text": generated_text.strip(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return {"error": str(e)}

    async def generate_report_description(self, title: str, report_type: str, modules: list) -> Dict[str, Any]:
        """Specific method for report descriptions"""
        prompt = f"""
        Generate a professional, concise executive summary description (2-3 sentences max) for a laboratory report.
        
        Report Title: {title}
        Report Type: {report_type}
        Included Sections: {', '.join(modules)}
        
        The description should sound authoritative and suitable for an audit trail or executive review.
        """
        
        return await self.execute({"prompt": prompt, "system_instruction": "You are a technical writer for a pharmaceutical/scientific laboratory."}, {})
    async def generate_chat_response(self, messages: list, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a structured JSON response for the chat interface
        """
        # Build conversation history
        conversation = ""
        for msg in messages:
             role = "User" if msg.get("role") == "user" else "Assistant"
             conversation += f"{role}: {msg.get('content')}\n"
             
        # Add dataset context if available
        data_context = ""
        if "dataset_context" in context:
            data_context = f"\nDATASET CONTEXT:\n{context['dataset_context']}\n"
            
        system_prompt = """
        You are Lab-IQ's AI Data Assistant. You help scientists analyze data and build models.
        
        CRITICAL: You must return a strict JSON object with a 'sections' list or a single 'content' field.
        Do NOT use Markdown formatting (like ```json). Just return the raw JSON.
        
        Response Scheme:
        {
            "sections": [
                { "type": "paragraph", "content": "Text here..." },
                { "type": "list", "title": "Key Points", "items": ["Item 1", "Item 2"] },
                { "type": "heading", "content": "Section Title" }
            ]
        }
        """
        
        full_prompt = f"{data_context}\nCONVERSATION HISTORY:\n{conversation}\nAssistant:"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"{system_prompt}\n\n{full_prompt}"}]
            }],
             "generationConfig": {
                "response_mime_type": "application/json"
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.text}")
                # Fallback response
                return {
                     "sections": [
                         {"type": "paragraph", "content": "I'm having trouble connecting to my brain right now. Please check the backend logs."}
                     ]
                }
                
            result = response.json()
            text_response = result.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
            
            # Clean up potential markdown code blocks if the model ignored instructions
            text_response = text_response.replace("```json", "").replace("```", "").strip()
            
            import json
            try:
                return json.loads(text_response)
            except json.JSONDecodeError:
                # Fallback if not valid JSON
                return {
                    "sections": [
                        {"type": "paragraph", "content": text_response}
                    ]
                }
                
        except Exception as e:
            logger.error(f"Chat generation error: {e}")
            return {
                "sections": [
                    {"type": "paragraph", "content": f"Error generating response: {str(e)}"}
                ]
            }
