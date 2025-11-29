from pydantic import BaseModel
from typing import Optional, List

class Receipt(BaseModel):
    receipt_date: str
    receipt_no: str

class RegistryEntry(BaseModel):
    rank: int
    purpose: str
    receipt: Optional[Receipt] = None
    owner_name: Optional[str] = None
    max_claim_amount: Optional[int] = None
    status: Optional[str] = None


class RegistrySnapshot(BaseModel):
    viewed_at: str
    gabu: List[RegistryEntry]
    eulgu: List[RegistryEntry]

# 🔥 추가해야 하는 부분 (route에서 import하던 바로 그거)
class RegistrySnapshotCreate(BaseModel):
    contract_id: int
    viewed_at: str
    gabu: List[RegistryEntry]
    eulgu: List[RegistryEntry]

class RegistrySnapshotResponse(BaseModel):
    id: int
    contract_id: int
    viewed_at: str
    gabu: List[RegistryEntry]
    eulgu: List[RegistryEntry]
