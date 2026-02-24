from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    category: Optional[str] = None
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