# backend/app/models/diff.py

from typing import List, Dict, Any

"""
등기부 변동 비교 로직
 - 갑구(gabu)
 - 을구(eulgu)
를 각각 rank 기준으로 매칭하여 변경(diff)을 계산한다.
"""

def compare_registry_lists(old_list: List[Dict], new_list: List[Dict]):
    """두 리스트(갑구/을구)를 비교하여 추가/삭제/변경된 항목을 찾는다."""

    old_map = {item["rank"]: item for item in old_list}
    new_map = {item["rank"]: item for item in new_list}

    added, removed, updated = [], [], []

    # 추가 & 변경 체크
    for rank, new_item in new_map.items():
        if rank not in old_map:
            added.append(new_item)
        else:
            old_item = old_map[rank]
            if old_item != new_item:
                updated.append({"old": old_item, "new": new_item})

    # 삭제 체크
    for rank, old_item in old_map.items():
        if rank not in new_map:
            removed.append(old_item)

    return {
        "added": added,
        "removed": removed,
        "updated": updated,
    }


def compare_snapshots(old_snapshot: Dict[str, Any], new_snapshot: Dict[str, Any]):
    """전체 스냅샷 비교 → gabu/eulgu 포함"""
    return {
        "gabu": compare_registry_lists(old_snapshot["gabu"], new_snapshot["gabu"]),
        "eulgu": compare_registry_lists(old_snapshot["eulgu"], new_snapshot["eulgu"])
    }
