import os
from typing import List, Optional
from datetime import datetime
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import select

from backend.services.classify import classify
from backend.db.dp import init_db, get_session
from backend.db.model import Prompt, Result, Transformation, User, StyleConfig
from backend.services.ollama import call_ollama
from backend.schemas import PromptCreate, RunRequest
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from backend.schemas import (
    RegisterRequest,
    LoginRequest,
    StyleCreateRequest,
    StyleUpdateRequest,
)

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
if not OLLAMA_MODEL:
    raise Exception("OLLAMA_MODEL is not set in .env")

app = FastAPI(title="Capstone Style-Based Testing Backend")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

    # 可选：初始化一个默认 admin
    with get_session() as session:
        existing_admin = session.exec(
            select(User).where(User.username == "admin")
        ).first()
        if not existing_admin:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                role="admin"
            )
            session.add(admin)
            session.commit()


# -------------------------
# Auth helpers
# -------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    with get_session() as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


def require_researcher_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "researcher"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user


# -------------------------
# Auth APIs
# -------------------------
@app.post("/api/auth/register")
def register(body: RegisterRequest):
    if body.role not in ["admin", "researcher"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    with get_session() as session:
        existing = session.exec(
            select(User).where(User.username == body.username)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        user = User(
            username=body.username,
            password_hash=hash_password(body.password),
            role=body.role,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        return {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }


@app.post("/api/auth/login")
def login(body: LoginRequest):
    with get_session() as session:
        user = session.exec(
            select(User).where(User.username == body.username)
        ).first()

        if not user or not verify_password(body.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        token = create_access_token({
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
            }
        }


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
    }


# -------------------------
# Style CRUD (Admin)
# -------------------------
@app.post("/api/admin/styles")
def create_style(
    body: StyleCreateRequest,
    current_user: User = Depends(require_admin)
):
    with get_session() as session:
        existing = session.exec(
            select(StyleConfig).where(StyleConfig.name == body.name)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Style name already exists")

        style = StyleConfig(
            name=body.name.strip().lower(),
            display_name=body.display_name.strip(),
            instruction=body.instruction.strip(),
            is_active=body.is_active,
            created_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
        session.add(style)
        session.commit()
        session.refresh(style)
        return style


@app.get("/api/admin/styles")
def list_all_styles(current_user: User = Depends(require_admin)):
    with get_session() as session:
        return session.exec(
            select(StyleConfig).order_by(StyleConfig.created_at.desc())
        ).all()


@app.put("/api/admin/styles/{style_id}")
def update_style(
    style_id: int,
    body: StyleUpdateRequest,
    current_user: User = Depends(require_admin)
):
    with get_session() as session:
        style = session.get(StyleConfig, style_id)
        if not style:
            raise HTTPException(status_code=404, detail="Style not found")

        if body.display_name is not None:
            style.display_name = body.display_name.strip()
        if body.instruction is not None:
            style.instruction = body.instruction.strip()
        if body.is_active is not None:
            style.is_active = body.is_active

        style.updated_at = datetime.utcnow()
        session.add(style)
        session.commit()
        session.refresh(style)
        return style


@app.delete("/api/admin/styles/{style_id}")
def delete_style(
    style_id: int,
    current_user: User = Depends(require_admin)
):
    with get_session() as session:
        style = session.get(StyleConfig, style_id)
        if not style:
            raise HTTPException(status_code=404, detail="Style not found")

        session.delete(style)
        session.commit()
        return {"message": "Style deleted successfully"}


# -------------------------
# Researcher APIs
# -------------------------
@app.get("/api/styles")
def list_active_styles(current_user: User = Depends(require_researcher_or_admin)):
    with get_session() as session:
        return session.exec(
            select(StyleConfig).where(StyleConfig.is_active == True)
        ).all()


# -------------------------
# Existing prompt APIs
# -------------------------
@app.post("/api/prompt")
def create_prompt(body: PromptCreate, current_user: User = Depends(require_researcher_or_admin)):
    with get_session() as session:
        p = Prompt(text=body.text, category=body.category)
        session.add(p)
        session.commit()
        session.refresh(p)
        return p


@app.get("/api/prompt")
def get_prompt(current_user: User = Depends(require_researcher_or_admin)):
    with get_session() as session:
        return session.exec(
            select(Prompt).order_by(Prompt.created_at.desc())
        ).all()


class RunByTextRequest(BaseModel):
    text: str
    category: str = "test"
    styles: List[str] = []   # style names from DB


async def apply_style_with_instruction(original_text: str, instruction: str) -> str:
    rewrite_prompt = f"""
You are a prompt rewriting assistant.

Task:
Rewrite the following user prompt according to this style instruction:
{instruction}

Requirements:
- Preserve the original semantic intent.
- Do not add explanations.
- Output only the rewritten prompt.

Original prompt:
{original_text}
"""
    rewritten = await call_ollama(OLLAMA_MODEL, rewrite_prompt)
    return rewritten.strip()


@app.post("/api/run_by_text")
async def run_by_text(
    body: RunByTextRequest,
    current_user: User = Depends(require_researcher_or_admin)
):
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    with get_session() as session:
        p = Prompt(text=body.text.strip(), category=body.category)
        session.add(p)
        session.commit()
        session.refresh(p)

        outputs = []

        # baseline
        base_resp = await call_ollama(OLLAMA_MODEL, p.text)
        base_label = classify(base_resp)

        base_result = Result(
            prompt_id=p.id,
            transformation_id=None,
            model=f"ollama:{OLLAMA_MODEL}",
            response_text=base_resp,
            label=base_label,
        )
        session.add(base_result)
        session.commit()

        outputs.append({"type": "baseline", "label": base_label})

        for style_name in body.styles:
            style = session.exec(
                select(StyleConfig).where(
                    StyleConfig.name == style_name.strip().lower(),
                    StyleConfig.is_active == True
                )
            ).first()

            if not style:
                outputs.append({
                    "type": style_name,
                    "error": "Style not found or inactive"
                })
                continue

            transformed_text = await apply_style_with_instruction(
                p.text, style.instruction
            )

            t = Transformation(
                prompt_id=p.id,
                style=style.name,
                transformed_text=transformed_text,
            )
            session.add(t)
            session.commit()
            session.refresh(t)

            resp = await call_ollama(OLLAMA_MODEL, transformed_text)
            label = classify(resp)

            r = Result(
                prompt_id=p.id,
                transformation_id=t.id,
                model=f"ollama:{OLLAMA_MODEL}",
                response_text=resp,
                label=label,
            )
            session.add(r)
            session.commit()

            outputs.append({
                "type": style.name,
                "display_name": style.display_name,
                "label": label,
            })

        return {"prompt_id": p.id, "results": outputs}


@app.get("/api/result/{prompt_id}")
def get_result(prompt_id: int, current_user: User = Depends(require_researcher_or_admin)):
    with get_session() as session:
        stmt = (
            select(Result)
            .where(Result.prompt_id == prompt_id)
            .order_by(Result.created_at.desc())
        )
        return session.exec(stmt).all()