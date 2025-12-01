from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from backend.app.database.database import get_db
from backend.app.models.notification_orm import ProcessedNotificationORM

router = APIRouter()


class NotificationCheckRequest(BaseModel):
    notification_id: str


class NotificationCheckResponse(BaseModel):
    should_show: bool
    is_duplicate: bool
    message: str


@router.post("/notifications/check", response_model=NotificationCheckResponse)
def check_notification(
    request: NotificationCheckRequest, db: Session = Depends(get_db)
):
    """
    알림 중복 체크 API
    - notification_id가 DB에 있으면 중복 (should_show: false)
    - 없으면 새 알림 (should_show: true) → DB에 저장
    """
    try:
        notification_id = request.notification_id

        # DB에서 확인
        existing = (
            db.query(ProcessedNotificationORM)
            .filter(ProcessedNotificationORM.notification_id == notification_id)
            .first()
        )

        if existing:
            # 이미 처리된 알림 (중복)
            return NotificationCheckResponse(
                should_show=False,
                is_duplicate=True,
                message="이미 처리된 알림입니다.",
            )

        # 새 알림 → DB에 저장 (race condition 방지를 위해 try-except 사용)
        try:
            new_notification = ProcessedNotificationORM(
                notification_id=notification_id,
                created_at=datetime.utcnow(),
                processed_at=datetime.utcnow(),
            )
            db.add(new_notification)
            db.commit()
            db.refresh(new_notification)
        except Exception as e:
            # 동시 요청으로 인한 중복 키 에러 처리
            db.rollback()
            # 다시 한 번 확인
            existing = (
                db.query(ProcessedNotificationORM)
                .filter(ProcessedNotificationORM.notification_id == notification_id)
                .first()
            )
            if existing:
                return NotificationCheckResponse(
                    should_show=False,
                    is_duplicate=True,
                    message="이미 처리된 알림입니다.",
                )
            # 다른 에러면 다시 raise
            raise e

        return NotificationCheckResponse(
            should_show=True,
            is_duplicate=False,
            message="새 알림입니다. 표시합니다.",
        )
    except Exception as e:
        # 에러 발생 시 로그 출력
        print(f"알림 체크 오류: {str(e)}")
        # 에러 발생 시 중복으로 간주 (안전한 선택)
        return NotificationCheckResponse(
            should_show=False,
            is_duplicate=True,
            message=f"오류 발생: {str(e)}",
        )


@router.get("/notifications")
def get_all_notifications(db: Session = Depends(get_db)):
    """
    모든 처리된 알림 조회 (디버깅용)
    """
    notifications = db.query(ProcessedNotificationORM).all()
    
    return {
        "total": len(notifications),
        "notifications": [
            {
                "id": n.id,
                "notification_id": n.notification_id,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "processed_at": n.processed_at.isoformat() if n.processed_at else None,
            }
            for n in notifications
        ],
    }


@router.delete("/notifications/all")
def delete_all_notifications(db: Session = Depends(get_db)):
    """
    모든 알림 삭제 (디버깅/테스트용)
    """
    count = db.query(ProcessedNotificationORM).delete()
    db.commit()
    
    return {
        "status": "success",
        "message": f"{count}개의 알림이 삭제되었습니다.",
        "deleted_count": count,
    }


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, db: Session = Depends(get_db)):
    """
    알림 처리 완료 후 DB에서 삭제
    """
    notification = (
        db.query(ProcessedNotificationORM)
        .filter(ProcessedNotificationORM.notification_id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")

    db.delete(notification)
    db.commit()

    return {"status": "success", "message": "알림이 삭제되었습니다."}

