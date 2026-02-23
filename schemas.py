from typing import Optional, List

from pydantic import BaseModel


class PromptCreate(BaseModel):
    text: str
    category: Optional[str] = None

class RunRequest(BaseModel):
    prompt_id: int
    styles: List[str] = ["poetry"]