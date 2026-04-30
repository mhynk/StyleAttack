from typing import Optional, List

from pydantic import BaseModel


class PromptCreate(BaseModel):
    text: str
    category: Optional[str] = None

class RunRequest(BaseModel):
    prompt_id: int
    styles: List[str] = ["poetry"]

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

class StyleCreateRequest(BaseModel):
    name: str
    display_name: str
    instruction: str
    is_active: bool = True

class StyleUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    instruction: Optional[str] = None
    is_active: Optional[bool] = None

class ModelCreateRequest(BaseModel):
    name: str
    display_name: str
    provider: str = "ollama"
    model_name: str
    is_active: bool = True


class ModelUpdateRequest(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    provider: Optional[str] = None
    model_name: Optional[str] = None
    is_active: Optional[bool] = None