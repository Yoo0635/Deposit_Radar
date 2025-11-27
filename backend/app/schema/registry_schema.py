from pydantic import BaseModel
from datetime import datetime

class RegistryCreate(BaseModel):
    contract_id: int
    change_type: str
    detail: str

class RegistryResponse(RegistryCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True