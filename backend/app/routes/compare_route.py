from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.crud.registry_snapshot_crud import get_last_two_snapshots
from app.services.diff_engine import compare_registry_snapshots

router = APIRouter(prefix="/compare", tags=["compare"])

@router.get("/{contract_id}")
def compare_snapshots(contract_id: int, db: Session = Depends(get_db)):
    """
    특정 계약의 최신 스냅샷 2개를 비교하여 diff 반환
    """
    old_snapshot, new_snapshot = get_last_two_snapshots(db, contract_id)

    if old_snapshot is None or new_snapshot is None:
        raise HTTPException(
            status_code=400,
            detail="스냅샷이 2개 이상 필요합니다. 최소 두 번 이상 열람해야 비교가 가능합니다."
        )

    diff_result = compare_registry_snapshots(old_snapshot, new_snapshot)

    return {
        "contract_id": contract_id,
        "diff": diff_result
    }
