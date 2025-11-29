from backend.app.database.crud.registry_snapshot_crud import (
    get_snapshot_by_contract_id,
    get_snapshot_by_id,
    create_snapshot,
)
from backend.app.services.diff_engine import compare_snapshots


"""
스냅샷 관리 서비스 계층
 - 최근 스냅샷 2개 가져오기
 - 특정 스냅샷 2개 비교
 - 실시간 조회값과 기존 스냅샷 비교
"""

# 🔥 ORM → dict 변환 헬퍼 함수 (필수)
def snapshot_to_dict(snapshot):
    return {
        "viewed_at": str(snapshot.viewed_at),
        "gabu": snapshot.gabu,
        "eulgu": snapshot.eulgu,
    }


def get_latest_two_snapshots(contract_id: int, db):
    snapshots = get_snapshot_by_contract_id(db, contract_id)
    if len(snapshots) < 2:
        return None, None
    return snapshots[-2], snapshots[-1]


def compare_latest_snapshots(contract_id: int, db):
    old, new = get_latest_two_snapshots(contract_id, db)
    if not old or not new:
        return {"error": "스냅샷이 2개 이상 필요합니다."}

    # 🔥 여기만 수정됨
    diff = compare_snapshots(snapshot_to_dict(old), snapshot_to_dict(new))

    return {
        "old_id": old.id,
        "new_id": new.id,
        "diff": diff
    }


def compare_two_snapshots(old_id: int, new_id: int, db):
    old = get_snapshot_by_id(db, old_id)
    new = get_snapshot_by_id(db, new_id)
    if not old or not new:
        return {"error": "스냅샷을 찾을 수 없습니다."}

    # 🔥 여기만 수정됨
    diff = compare_snapshots(snapshot_to_dict(old), snapshot_to_dict(new))
    
    return {"diff": diff}


def compare_live_with_snapshot(contract_id: int, live_data: dict, db):
    snapshots = get_snapshot_by_contract_id(db, contract_id)
    if not snapshots:
        return {"error": "저장된 스냅샷이 없습니다."}

    latest = snapshots[-1]

    # 🔥 livedata는 이미 dict, snapshot만 변환
    diff = compare_snapshots(snapshot_to_dict(latest), live_data)

    return {"snapshot_id": latest.id, "diff": diff}
