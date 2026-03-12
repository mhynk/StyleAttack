from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    category: Optional[str] = None
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class Transformation(SQLModel, table=True):
    """Style-transformed prompts (poetry/narrative/metaphor/euphemism)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt_id: int = Field(index=True)
    style: str
    transformed_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Result(SQLModel, table=True):
    """Model response for a baseline or transformed prompt."""
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt_id: int = Field(index=True)
    transformation_id: Optional[int] = Field(default=None, index=True)  # None => baseline
    model: str
    response_text: str
    label: str  # refused | partial | complied
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(index=True)   # "admin" or "researcher"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StyleConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)          # poetry
    display_name: str                                   # Poetry
    instruction: str                                    # rewrite instruction
    is_active: bool = True
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)