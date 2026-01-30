"""
Content Generation Agent - Uses Groq API (PRIMARY) with Gemini fallback
"""
import os
import requests
import logging
import json
from typing import Dict, Any, Optional
from .base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ContentAgent(BaseAgent):
    """Agent responsible for generating text content using Groq (primary) or Gemini (fallback)"""

    def __init__(self):
        super().__init__("content_agent", "Content Generation Agent 📝")
        # PRIMARY: Groq API (free tier, fast)
        self.groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_API_KEY")
        self.groq_api_url = "https://api.groq.com/openai/v1/chat/completions"
        # FALLBACK: Gemini API
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def _call_groq(self, prompt: str, system_instruction: str) -> Dict[str, Any]:
        """Call Groq API"""
        if not self.groq_api_key:
            return None

        try:
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]

            response = requests.post(
                self.groq_api_url,
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "max_tokens": 2048,
                    "temperature": 0.7
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.groq_api_key}"
                },
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {"generated_text": text.strip(), "status": "success", "provider": "groq"}
            else:
                logger.warning(f"Groq API error: {response.status_code}")
                return None

        except Exception as e:
            logger.warning(f"Groq API failed: {e}")
            return None

    def _call_gemini(self, prompt: str, system_instruction: str) -> Dict[str, Any]:
        """Call Gemini API as fallback"""
        if not self.gemini_api_key:
            return None

        try:
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_instruction}\n\nUser Request: {prompt}"}]
                }]
            }

            response = requests.post(
                f"{self.gemini_api_url}?key={self.gemini_api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                text = result.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                return {"generated_text": text.strip(), "status": "success", "provider": "gemini"}
            else:
                logger.warning(f"Gemini API error: {response.status_code}")
                return None

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}")
            return None

    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate content - tries Groq first, then Gemini"""
        prompt = data.get("prompt")
        system_instruction = data.get("system_instruction", "You are a helpful AI assistant for a laboratory management system specializing in biotech and health research.")

        if not prompt:
            return {"error": "No prompt provided"}

        # Try Groq first (primary)
        result = self._call_groq(prompt, system_instruction)
        if result:
            return result

        # Fallback to Gemini
        result = self._call_gemini(prompt, system_instruction)
        if result:
            return result

        return {"error": "No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY."}

    async def generate_report_description(self, title: str, report_type: str, modules: list) -> Dict[str, Any]:
        """Specific method for report descriptions"""
        prompt = f"""Generate a professional, concise executive summary description (2-3 sentences max) for a laboratory report.
        
Report Title: {title}
Report Type: {report_type}
Included Sections: {', '.join(modules)}

The description should sound authoritative and suitable for an audit trail or executive review."""

        return await self.execute({"prompt": prompt, "system_instruction": "You are a technical writer for a pharmaceutical/scientific laboratory."}, {})

    async def generate_chat_response(self, messages: list, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a structured JSON response for the chat interface"""
        conversation = ""
        for msg in messages:
            role = "User" if msg.get("role") == "user" else "Assistant"
            conversation += f"{role}: {msg.get('content')}\n"

        data_context = ""
        if "dataset_context" in context:
            data_context = f"\nDATASET CONTEXT:\n{context['dataset_context']}\n"

        system_prompt = """You are DataIQ's AI Data Assistant. You help analysts analyze data and build models.

Return a JSON object with a 'sections' list:
{
    "sections": [
        { "type": "paragraph", "content": "Text here..." },
        { "type": "list", "title": "Key Points", "items": ["Item 1", "Item 2"] },
        { "type": "heading", "content": "Section Title" }
    ]
}"""

        full_prompt = f"{data_context}\nCONVERSATION HISTORY:\n{conversation}\nAssistant (respond in JSON):"

        result = await self.execute({"prompt": full_prompt, "system_instruction": system_prompt}, context)

        if result.get("status") == "success":
            text_response = result.get("generated_text", "")
            # Clean up potential markdown code blocks
            text_response = text_response.replace("```json", "").replace("```", "").strip()
            
            try:
                return json.loads(text_response)
            except json.JSONDecodeError:
                return {"sections": [{"type": "paragraph", "content": text_response}]}
        else:
            return {"sections": [{"type": "paragraph", "content": result.get("error", "Error generating response")}]}
