# src/game_builder_crew/tools/gemini_image_tool.py
import os
import uuid
# --- REMOVE base64 import, it's not needed here ---
# import base64
# ---------------------------------------------------
from io import BytesIO
from typing import Type, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    raise ImportError(
        "google-genai library not found or import failed. "
        "Ensure it's installed (`poetry add google-genai` or `pip install google-genai`) "
        "and that the old 'google-generativeai' is removed if conflicting."
    )

try:
    from PIL import Image
except ImportError:
    raise ImportError("Pillow library not found. Please install it using `pip install Pillow`")

try:
    from dotenv import load_dotenv
except ImportError:
    print("Warning: python-dotenv library not found, cannot load .env file automatically.")
    load_dotenv = lambda: None

from pydantic import BaseModel, Field
from crewai.tools import BaseTool

load_dotenv()

class ImagePromptSchema(BaseModel):
    """Input schema for the Gemini Image Generation Tool."""
    image_description: str = Field(..., description="Detailed description of the image asset to be generated.")
    output_filename: str = Field(..., description="Desired filename for the output image (without extension).")

class GeminiImageTool(BaseTool):
    name: str = "Gemini Game Asset Generator (SDK - Experimental)"
    description: str = (
        "Generates a single game asset image based on a detailed description and saves it "
        "with a specific filename using Google's experimental Gemini Flash model "
        "(via the google-genai SDK). Returns the file path."
    )
    args_schema: Type[BaseModel] = ImagePromptSchema

    model_name: str = "gemini-2.0-flash-exp-image-generation"
    output_dir: str = "generated_game_assets"

    def __init__(self, output_dir: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.output_dir = output_dir or "generated_game_assets"
        os.makedirs(self.output_dir, exist_ok=True)

    def _run(self, image_description: str, output_filename: str) -> str:
        """Generates and saves an image based on the description using the specified filename."""
        print(f"---\nExecuting GeminiImageTool for: '{image_description}' -> saving as '{output_filename}.[ext]'\n---")

        if not image_description or not output_filename:
            return "Error: Both image_description and output_filename are required."

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return "Error: Gemini API Key (GEMINI_API_KEY or GOOGLE_API_KEY) not found in environment."

        try:
            print("Initializing google.genai Client...")
            client = genai.Client(api_key=api_key)
            print("Client initialized.")

            print(f"Sending request to model: {self.model_name}")
            response = client.models.generate_content(
                model=self.model_name,
                contents=image_description,
                config=types.GenerateContentConfig(
                  response_modalities=['TEXT', 'IMAGE']
                )
            )
            print("Received response from API.")

            generated_text = None
            processed_image = False

            if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                print(f"Processing {len(response.candidates[0].content.parts)} parts in candidate...")
                for i, part in enumerate(response.candidates[0].content.parts):
                    if part.text is not None:
                        generated_text = part.text
                        print(f"  Part {i}: Found text (ignored by tool output): {generated_text[:100]}...")
                    elif part.inline_data is not None and part.inline_data.mime_type.startswith('image/'):
                        print(f"  Part {i}: Found image data (mime_type: {part.inline_data.mime_type}). Opening raw bytes...")
                        try:
                            # --- FIX: Use inline_data.data directly with BytesIO ---
                            # The SDK provides raw bytes here, not base64
                            img = Image.open(BytesIO(part.inline_data.data))
                            # -------------------------------------------------------

                            ext = img.format.lower() if img.format else "png"
                            final_filename = f"{output_filename}.{ext}"
                            image_path = os.path.join(self.output_dir, final_filename)

                            img.save(image_path)
                            processed_image = True
                            print(f"  Image successfully opened and saved to: {image_path}")
                            return f"Image asset successfully generated for '{image_description}' and saved to: {image_path}"

                        except Exception as e:
                            # This is where the "cannot identify image file" error happened before
                            print(f"  Error opening/saving image data from part {i}: {e}")
                            # Log the exception traceback for more detail if needed
                            import traceback
                            print(traceback.format_exc())
                            break # Stop processing parts for this item on error

            if not processed_image:
                 # Error handling for blocked prompt or no image data remains the same
                 try:
                     finish_reason_enum = genai.types.FinishReason
                 except AttributeError:
                     finish_reason_enum = None

                 if response.prompt_feedback and response.prompt_feedback.block_reason:
                      block_reason = response.prompt_feedback.block_reason
                      print(f"Error: Prompt was blocked. Reason: {block_reason}")
                      return f"Error: Image generation failed because the prompt was blocked ({block_reason})."
                 elif response.candidates and finish_reason_enum and response.candidates[0].finish_reason != finish_reason_enum.STOP:
                      finish_reason = response.candidates[0].finish_reason.name
                      print(f"Error: Generation stopped abnormally. Reason: {finish_reason}")
                      return f"Error: Image generation failed. Finish Reason: {finish_reason}."
                 else:
                      print("Error: No image data found in the response parts or failed to process.")
                      print(f"DEBUG: Full Response Object:\n{response}")
                      return f"Error: No image data found/processed for '{image_description}'. Text part: {generated_text or 'N/A'}"

        except Exception as e:
            import traceback
            print(f"An unexpected error occurred in GeminiImageTool:")
            print(traceback.format_exc())
            error_details = getattr(e, 'message', str(e))
            return f"Error during image generation API call or processing: {error_details}"