from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from backend.app.database.database import get_db
from backend.app.database.crud.registry_snapshot_crud import create_snapshot, get_snapshot_by_contract_id
from backend.app.database.crud.contract_crud import update_contract, get_contract_by_id
from backend.app.schema.registry_snapshot_schema import (
    RegistrySnapshotCreate,
    RegistrySnapshotResponse,
)

from backend.app.services.snapshot_service import get_latest_two_snapshots

router = APIRouter(prefix="/snapshot", tags=["snapshot"])



@router.get("/{contract_id}")
def get_two_snapshots(contract_id: int, db: Session = Depends(get_db)):
    """
    최신 스냅샷 2개 반환
    """
    old, new = get_latest_two_snapshots(contract_id, db)

    return {
        "old": old,
        "new": new
    }

@router.post("/")
def create_snapshot_route(payload: RegistrySnapshotCreate, db: Session = Depends(get_db)):
    return create_snapshot(
        db=db,
        contract_id=payload.contract_id,
        viewed_at=payload.viewed_at,
        gabu=payload.gabu,
        eulgu=payload.eulgu
    )

@router.post("/{contract_id}/auto-second")
def generate_second_snapshot_for_red_risk(
    contract_id: int,
    db: Session = Depends(get_db)
):
    """
    두 번째 스냅샷을 자동으로 생성하여 위험도가 AMBER가 나오도록 설정
    
    - 첫 번째 스냅샷을 가져와서 근저당 금액을 증가시킨 두 번째 스냅샷 생성
    - 보증금을 3억 5천만원으로 조정하여 LTV가 AMBER 범위(60% ≤ LTV < 80%)가 되도록 설정
    """
    print(f"🔄 [자동 두 번째 스냅샷 생성] Contract ID: {contract_id}")
    
    # 1) 계약 정보 조회
    contract = get_contract_by_id(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다.")
    
    # 2) 첫 번째 스냅샷 가져오기
    snapshots = get_snapshot_by_contract_id(db, contract_id)
    if len(snapshots) == 0:
        raise HTTPException(status_code=404, detail="첫 번째 스냅샷이 없습니다. 먼저 스냅샷을 생성해주세요.")
    
    first_snapshot = snapshots[-1]  # 가장 최근 스냅샷
    print(f"📸 [첫 번째 스냅샷] ID: {first_snapshot.id}")
    
    # 3) 첫 번째 스냅샷의 근저당 금액 확인
    first_eulgu = first_snapshot.eulgu or []
    first_mortgage_amount = 0
    
    for item in first_eulgu:
        if item.get('purpose') == '근저당권설정':
            first_mortgage_amount = item.get('max_claim_amount', 0) or 0
            break
    
    # 4) 두 번째 스냅샷 생성 (근저당 금액 대폭 증가)
    # 첫 번째 금액의 약 2배로 증가 (RED 위험도 확보)
    second_mortgage_amount = int(first_mortgage_amount * 2) if first_mortgage_amount > 0 else 2000000000
    
    print(f"💰 [근저당 금액 변경] {first_mortgage_amount:,}원 → {second_mortgage_amount:,}원")
    
    # 5) 두 번째 스냅샷 데이터 생성
    # 갑구는 그대로 유지
    second_gabu = first_snapshot.gabu or []
    
    # 을구는 근저당 금액만 증가
    second_eulgu = []
    for item in first_eulgu:
        if item.get('purpose') == '근저당권설정':
            # 근저당 금액 증가
            new_item = item.copy()
            new_item['max_claim_amount'] = second_mortgage_amount
            # receipt_date도 업데이트 (오늘 날짜)
            if 'receipt' in new_item and new_item['receipt']:
                new_item['receipt']['receipt_date'] = datetime.now().strftime("%Y-%m-%d")
                new_item['receipt']['receipt_no'] = f"제{datetime.now().strftime('%Y%m%d')}호"
            else:
                new_item['receipt'] = {
                    'receipt_date': datetime.now().strftime("%Y-%m-%d"),
                    'receipt_no': f"제{datetime.now().strftime('%Y%m%d')}호"
                }
            second_eulgu.append(new_item)
        else:
            # 다른 을구 항목은 그대로 유지
            second_eulgu.append(item)
    
    # 6) 두 번째 스냅샷 생성
    from backend.app.schema.registry_snapshot_schema import RegistryEntry
    from datetime import date
    
    # viewed_at은 오늘 날짜로 설정
    viewed_at = datetime.now().strftime("%Y-%m-%d")
    
    # Pydantic 모델로 변환
    gabu_entries = [RegistryEntry(**item) for item in second_gabu]
    eulgu_entries = [RegistryEntry(**item) for item in second_eulgu]
    
    second_snapshot = create_snapshot(
        db=db,
        contract_id=contract_id,
        viewed_at=viewed_at,
        gabu=gabu_entries,
        eulgu=eulgu_entries
    )
    
    print(f"✅ [두 번째 스냅샷 생성 완료] ID: {second_snapshot.id}")
    
    # 7) 시세 조정 - 보증금 1억원에서 GREEN 위험도가 나오도록 시세 동적 계산
    # LTV 계산: (보증금 + 선순위 합계) / 시세 × 100
    # GREEN 범위: LTV < 60%
    
    # 선순위 합계 계산 (을구에서 추출)
    from backend.app.services.liens_service import extract_total_liens
    total_liens = extract_total_liens(second_eulgu)
    
    # 현재 보증금 가져오기
    current_deposit = contract.deposit
    
    # 시세 가져오기
    market_price = contract.market_price or 2_000_000_000  # 기본값 20억원
    
    print(f"🔍 [시세 확인] DB에서 가져온 시세: {market_price:,}원")
    
    # ⚠️ 중요: 보증금 1억원에서 GREEN이 나오도록 시세를 자동으로 조정
    # GREEN 조건: LTV < 60%
    # (보증금 + 선순위 합계) / 시세 < 0.6
    # 시세 > (보증금 + 선순위 합계) / 0.6
    
    total_debt = current_deposit + total_liens
    min_market_price_for_green = int(total_debt / 0.6)  # GREEN 범위를 위한 최소 시세
    
    print(f"🔍 [계산 확인] 보증금: {current_deposit:,}원, 선순위 합계: {total_liens:,}원")
    print(f"🔍 [계산 확인] 총 채무: {total_debt:,}원, 최소 시세 (GREEN): {min_market_price_for_green:,}원")
    
    # ⚠️ 중요: 시세가 이미 충분히 크면 조정하지 않음 (중복 조정 방지)
    # 시세가 최소 시세의 1.2배 이상이면 이미 충분히 조정된 것으로 간주
    max_reasonable_market_price = int(min_market_price_for_green * 1.2)
    
    # ⚠️ 핵심: 시세가 50억원 이상이면 무조건 비정상으로 간주하고 재설정
    if market_price > 50_000_000_000:
        # 시세가 비정상적으로 크면 경고하고 원래 계산된 값으로 재설정
        print(f"⚠️ [시세 비정상 감지] 시세가 비정상적으로 큽니다: {market_price:,}원")
        print(f"   최대 합리적 시세: {max_reasonable_market_price:,}원")
        print(f"   시세를 재계산하여 설정합니다.")
        adjusted_market_price = int(min_market_price_for_green * 1.1)
        market_price = adjusted_market_price
        update_contract(db, contract_id, {"market_price": market_price})
        db.refresh(contract)
        print(f"✅ [시세 재설정 완료] 시세를 {market_price:,}원으로 재설정함")
    elif market_price < min_market_price_for_green:
        # 시세가 부족하면 자동으로 조정 (여유를 두고 10% 추가하여 LTV가 55% 정도가 되도록)
        adjusted_market_price = int(min_market_price_for_green * 1.1)
        print(f"⚠️ [시세 자동 조정] 보증금 {current_deposit:,}원에서 GREEN이 나오도록 시세를 조정합니다.")
        print(f"   선순위 합계: {total_liens:,}원, 총 채무: {total_debt:,}원")
        print(f"   기존 시세: {market_price:,}원 → 조정된 시세: {adjusted_market_price:,}원")
        market_price = adjusted_market_price
        # 조정된 시세를 DB에 저장
        update_contract(db, contract_id, {"market_price": market_price})
        db.refresh(contract)
        print(f"✅ [시세 저장 완료] DB에 시세 {market_price:,}원 저장됨")
    elif market_price > max_reasonable_market_price:
        # 시세가 합리적 범위를 초과하면 재설정
        print(f"⚠️ [시세 범위 초과] 시세가 합리적 범위를 초과합니다: {market_price:,}원")
        print(f"   최대 합리적 시세: {max_reasonable_market_price:,}원")
        print(f"   시세를 재계산하여 설정합니다.")
        adjusted_market_price = int(min_market_price_for_green * 1.1)
        market_price = adjusted_market_price
        update_contract(db, contract_id, {"market_price": market_price})
        db.refresh(contract)
        print(f"✅ [시세 재설정 완료] 시세를 {market_price:,}원으로 재설정함")
    else:
        print(f"✅ [시세 유지] 현재 시세 {market_price:,}원이 적절합니다. (최소: {min_market_price_for_green:,}원, 최대: {max_reasonable_market_price:,}원)")
    
    # 예상 LTV 계산 (검증용)
    expected_ltv = (total_debt / market_price) * 100
    expected_risk = "GREEN" if expected_ltv < 60 else ("AMBER" if expected_ltv < 80 else "RED")
    
    print(f"💰 [보증금 유지] {current_deposit:,}원 (변경 없음)")
    print(f"📊 [예상 LTV] {expected_ltv:.1f}% (보증금: {current_deposit:,}원, 선순위 합계: {total_liens:,}원, 시세: {market_price:,}원)")
    print(f"🎯 [예상 위험등급] {expected_risk} (LTV < 60% = GREEN)")
    print(f"⚠️ [중요] LTV는 PDF 생성 시점에 자동으로 재계산됩니다.")
    
    # 8) 응답 반환
    return RegistrySnapshotResponse(
        id=second_snapshot.id,
        contract_id=second_snapshot.contract_id,
        viewed_at=second_snapshot.viewed_at.strftime("%Y-%m-%d") if hasattr(second_snapshot.viewed_at, 'strftime') else str(second_snapshot.viewed_at),
        gabu=[RegistryEntry(**item) for item in second_snapshot.gabu],
        eulgu=[RegistryEntry(**item) for item in second_snapshot.eulgu]
    )

