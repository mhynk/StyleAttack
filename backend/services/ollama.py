import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_URL = f"{OLLAMA_BASE_URL}/api/generate"


async def call_ollama(model: str, prompt: str) -> str:
    if not model:
        raise ValueError("OLLAMA_MODEL is not set in .env")

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(OLLAMA_URL, json=payload)
        r.raise_for_status()
        return r.json().get("response", "")