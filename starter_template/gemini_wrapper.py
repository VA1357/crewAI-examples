# gemini_wrapper.py
import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Any

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class GeminiLLM:
    def __init__(self, model_name="models/gemini-1.5-flash"):
        self.model = genai.GenerativeModel(model_name)

    def __call__(self, prompt: str, **kwargs: Any) -> str:
        response = self.model.generate_content(prompt)
        return response.text.strip()

    def run(self, prompt: str, **kwargs: Any) -> str:
        return self.__call__(prompt, **kwargs)

    def supports_stop_words(self) -> bool:
        return False
