from sqlalchemy.orm import Session
from backend.app.models.registry_snapshot_orm import RegistrySnapshotORM


def calculate_diff(db: Session, contract_id: int):
    snapshots = (
        db.query(RegistrySnapshotORM)
        .filter(RegistrySnapshotORM.contract_id == contract_id)
        .order_by(RegistrySnapshotORM.created_at.desc())
        .limit(2)
        .all()
    )

    if len(snapshots) < 2:
        return {"detail": "Not enough snapshots to compare"}

    latest = snapshots[0]
    previous = snapshots[1]

    def list_to_dict(entries):
        result = {}
        for e in entries:
            key = f"{e.get('rank')}_{e.get('receipt', {}).get('receipt_no')}"
            result[key] = e
        return result

    latest_gabu = list_to_dict(latest.gabu)
    previous_gabu = list_to_dict(previous.gabu)

    latest_eulgu = list_to_dict(latest.eulgu)
    previous_eulgu = list_to_dict(previous.eulgu)

    diff = {
        "added": {
            "gabu": [],
            "eulgu": []
        },
        "removed": {
            "gabu": [],
            "eulgu": []
        },
        "changed": {
            "gabu": [],
            "eulgu": []
        },
    }

    # --------- GABU 비교 ---------
    for key, item in latest_gabu.items():
        if key not in previous_gabu:
            diff["added"]["gabu"].append(item)
        elif item != previous_gabu[key]:
            diff["changed"]["gabu"].append(item)

    for key, item in previous_gabu.items():
        if key not in latest_gabu:
            diff["removed"]["gabu"].append(item)

    # --------- EULGU 비교 ---------
    for key, item in latest_eulgu.items():
        if key not in previous_eulgu:
            diff["added"]["eulgu"].append(item)
        elif item != previous_eulgu[key]:
            diff["changed"]["eulgu"].append(item)

    for key, item in previous_eulgu.items():
        if key not in latest_eulgu:
            diff["removed"]["eulgu"].append(item)

    return diff
