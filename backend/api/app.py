import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from sqlmodel import select

from backend.services.classify import classify
from backend.db.dp import init_db, get_session
from backend.db.model import Prompt, Result, Transformation
from backend.services.ollama import call_ollama
from backend.schemas import PromptCreate, RunRequest
from backend.services.transforms import STYLE_FUNCS

load_dotenv()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")

if not OLLAMA_MODEL:
    raise Exception("OLLAMA_MODEL is not set in .env")

app = FastAPI(title="Capstone Style-Based Testing Backend")


@app.on_event("startup")
def on_startup():
    init_db()


@app.post("/api/prompt")
def create_prompt(body: PromptCreate):
    with get_session() as session:
        p = Prompt(text=body.text, category=body.category)
        session.add(p)
        session.commit()
        session.refresh(p)
        return p


@app.get("/api/prompt")
def get_prompt():
    with get_session() as session:
        return session.exec(
            select(Prompt).order_by(Prompt.created_at.desc())
        ).all()


@app.post("/api/run")
async def run_request(req: RunRequest):

    with get_session() as session:

        prompt = session.get(Prompt, req.prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        outputs = []

        # baseline
        base_resp = await call_ollama(OLLAMA_MODEL, prompt.text)
        base_label = classify(base_resp)

        base_result = Result(
            prompt_id=prompt.id,
            transformation_id=None,
            model=f"ollama:{OLLAMA_MODEL}",
            response_text=base_resp,
            label=base_label
        )

        session.add(base_result)
        session.commit()

        outputs.append({
            "type": "baseline",
            "label": base_label
        })

        # style loop
        for style in req.styles:
            style = style.lower()

            if style not in STYLE_FUNCS:
                outputs.append({
                    "type": "style",
                    "error": f"Style '{style}' not found"
                })
                continue

            transform_fn = STYLE_FUNCS[style]
            transformed_text = transform_fn(prompt.text)

            t = Transformation(
                prompt_id=prompt.id,
                style=style,
                transformed_text=transformed_text
            )

            session.add(t)
            session.commit()
            session.refresh(t)

            resp = await call_ollama(OLLAMA_MODEL, transformed_text)
            label = classify(resp)

            r = Result(
                prompt_id=prompt.id,
                transformation_id=t.id,
                model=f"ollama:{OLLAMA_MODEL}",
                response_text=resp,
                label=label
            )

            session.add(r)
            session.commit()

            outputs.append({
                "type": style,
                "label": label
            })

        return {
            "prompt_id": prompt.id,
            "results": outputs
        }


@app.get("/api/result/{prompt_id}")
def get_result(prompt_id: int):
    with get_session() as session:
        stmt = select(Result).where(
            Result.prompt_id == prompt_id
        ).order_by(Result.created_at.desc())
        return session.exec(stmt).all()