# backend/app/services/diff_engine.py

"""
등기부 스냅샷 간 비교(diff) 엔진.

입력 형식 (old, new 예시):

{
  "viewed_at": "2025-01-10",
  "gabu": [ { ... }, ... ],
  "eulgu": [ { ... }, ... ]
}

각 항목은 RegistryEntry 구조(dict)라고 가정한다.
"""

from typing import Dict, List, Tuple, Any


def _index_entries(entries: List[Dict[str, Any]]) -> Dict[Tuple[int, str], Dict[str, Any]]:
    """
    엔트리를 (rank, purpose)를 키로 해서 매핑한다.
    - 같은 순위/목적이면 같은 등기항목으로 보고 updated 여부를 판단.
    """
    index: Dict[Tuple[int, str], Dict[str, Any]] = {}
    for e in entries:
        key = (e.get("rank"), e.get("purpose"))
        index[key] = e
    return index


def _diff_section(old_list: List[Dict[str, Any]], new_list: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    old_index = _index_entries(old_list)
    new_index = _index_entries(new_list)

    added: List[Dict[str, Any]] = []
    removed: List[Dict[str, Any]] = []
    updated: List[Dict[str, Any]] = []

    # removed & updated
    for key, old_entry in old_index.items():
        if key not in new_index:
            removed.append(old_entry)
        else:
            new_entry = new_index[key]
            if old_entry != new_entry:
                updated.append({"old": old_entry, "new": new_entry})

    # added
    for key, new_entry in new_index.items():
        if key not in old_index:
            added.append(new_entry)

    return {
        "added": added,
        "removed": removed,
        "updated": updated,
    }


def compare_snapshots(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    두 스냅샷(old, new)을 비교해서 갑구/을구 각각에 대해
    added / removed / updated 목록을 반환.
    """
    old_gabu = old.get("gabu", []) or []
    new_gabu = new.get("gabu", []) or []

    old_eulgu = old.get("eulgu", []) or []
    new_eulgu = new.get("eulgu", []) or []

    return {
        "gabu": _diff_section(old_gabu, new_gabu),
        "eulgu": _diff_section(old_eulgu, new_eulgu),
    }
