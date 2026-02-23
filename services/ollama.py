import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"

async def call_ollama(model:str, prompt:str):
    payload = {"model": model, "prompt": prompt,"stream":False}
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(OLLAMA_URL, json=payload)
        r.raise_for_status()
        return r.json().get("Response:","")