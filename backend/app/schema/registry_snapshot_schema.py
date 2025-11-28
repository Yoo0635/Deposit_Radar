from pydantic import BaseModel
from typing import Any, List, Dict
from datetime import date, datetime

class RegistrySnapshotCreate(BaseModel):
    contract_id: int
    viewed_at: date
    gabu: List[Dict[str, Any]]
    eulgu: List[Dict[str, Any]]

class RegistrySnapshotResponse(RegistrySnapshotCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
