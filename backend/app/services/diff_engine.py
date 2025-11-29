# backend/app/services/diff_engine.py

from typing import List, Dict, Any


def _extract_field(item: Dict[str, Any], key: str):
    """
    중첩된 JSON 구조에서도 안전하게 필드를 추출하는 헬퍼 함수.
    """
    # receipt_no / receipt_date → receipt 내부에 있을 가능성이 높음
    if key in ["receipt_no", "receipt_date"]:
        receipt = item.get("receipt", {})
        return receipt.get(key)

    # 기본 키는 그냥 item[key]
    return item.get(key)


def _index_entries(entries: List[Dict[str, Any]], unique_keys: List[str]):
    """
    entries: 갑구/을구 리스트
    unique_keys: 비교 기준 키 (예: ["receipt_no", "purpose"])
    """
    index = {}

    for item in entries:
        key = tuple(_extract_field(item, k) for k in unique_keys)
        index[key] = item
    
    return index


def compare_section(old_section: List[Dict[str, Any]],
                    new_section: List[Dict[str, Any]],
                    unique_keys: List[str]):
    """
    old_section: 이전 스냅샷의 갑구 또는 을구
    new_section: 최신 스냅샷의 갑구 또는 을구
    unique_keys: 등기를 식별하는 고유값
    """

    old_index = _index_entries(old_section, unique_keys)
    new_index = _index_entries(new_section, unique_keys)

    added = []
    removed = []
    updated = []

    # 새로 추가된 항목
    for key, new_item in new_index.items():
        if key not in old_index:
            added.append(new_item)

    # 삭제된 항목
    for key, old_item in old_index.items():
        if key not in new_index:
            removed.append(old_item)

    # 변경된 항목
    for key in old_index.keys() & new_index.keys():
        old_item = old_index[key]
        new_item = new_index[key]

        diff_fields = {}

        for field in new_item.keys():
            old_value = old_item.get(field)
            new_value = new_item.get(field)

            if old_value != new_value:
                diff_fields[field] = {
                    "old": old_value,
                    "new": new_value
                }

        if diff_fields:
            updated.append({
                "before": old_item,
                "after": new_item,
                "changes": diff_fields
            })

    return {
        "added": added,
        "removed": removed,
        "updated": updated
    }


def compare_registry_snapshots(old: Dict[str, Any], new: Dict[str, Any]):
    """
    old, new: 전체 스냅샷 (갑구/을구 모두 포함)
    """

    return {
        "gabu": compare_section(old.get("gabu", []), new.get("gabu", []), unique_keys=["receipt_no", "purpose"]),
        "eulgu": compare_section(old.get("eulgu", []), new.get("eulgu", []), unique_keys=["receipt_no", "purpose"]),
    }
