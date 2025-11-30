from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.services.address_service import search_address

router = APIRouter(
    prefix="/address",
    tags=["address"]
)

class AddressSearchRequest(BaseModel):
    keyword: str

@router.post("/search")
def address_search(req: AddressSearchRequest):
    """
    주소 검색 API — 백엔드에서 행안부 API 호출
    """
    results = search_address(req.keyword)
    return {"count": len(results), "addresses": results}
