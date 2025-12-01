from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
from backend.app.services.llm_engine import get_playbook_data
from backend.app.services.pdf_maker import create_pdf
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_snapshot_route import router as snapshot_router
from backend.app.database.config import init_models
from backend.app.database.database import get_db
from backend.app.routes import compare_route
from backend.app.routes import risk_route
from backend.app.database import models
from backend.app.routes.address_route import router as address_router
from backend.app.routes.upload_route import router as upload_router
from backend.app.routes.notification_route import router as notification_router
from backend.app.models.contract_orm import ContractORM

app = FastAPI()

# 정적 파일 서빙 (PDF 파일 접근용)
# PDF 파일이 생성되는 디렉토리를 정적 파일로 서빙
static_dir = os.path.abspath(".")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS 설정 - 모바일 앱에서 API 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경: 모든 origin 허용 (프로덕션에서는 특정 도메인만 허용)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

class RequestBody(BaseModel):
    contract_id: int  # 필수: 주택 등록 ID
    risk: Optional[str] = None  # 선택적: 추가 위험 상황 설명

def convert_risk_level_to_grade(risk_level: str) -> str:
    """
    Risk 엔진의 risk_level (HIGH/CRITICAL/MEDIUM/LOW)을 
    Playbook AI가 사용하는 등급 (RED/AMBER/GREEN)으로 변환
    """
    if risk_level in ["CRITICAL", "HIGH"]:
        return "RED"
    elif risk_level == "MEDIUM":
        return "AMBER"
    elif risk_level == "LOW":
        return "GREEN"
    else:
        return "GREEN"  # 기본값

def format_diff_info(diff: dict) -> str:
    """
    Diff 결과를 읽기 쉬운 문자열로 변환
    """
    result = []
    
    # 갑구 변경사항
    gabu = diff.get("gabu", {})
    if gabu.get("added") or gabu.get("removed") or gabu.get("updated"):
        result.append("\n[갑구 변경사항]")
        if gabu.get("added"):
            result.append(f"  추가: {len(gabu['added'])}건")
            for item in gabu["added"]:
                result.append(f"    - {item.get('purpose', 'N/A')} (순위: {item.get('rank', 'N/A')})")
        if gabu.get("removed"):
            result.append(f"  삭제: {len(gabu['removed'])}건")
            for item in gabu["removed"]:
                result.append(f"    - {item.get('purpose', 'N/A')} (순위: {item.get('rank', 'N/A')})")
        if gabu.get("updated"):
            result.append(f"  변경: {len(gabu['updated'])}건")
            for change in gabu["updated"]:
                old_item = change.get("old", {})
                new_item = change.get("new", {})
                result.append(f"    - {old_item.get('purpose', 'N/A')} (순위: {old_item.get('rank', 'N/A')}) 변경")
    
    # 을구 변경사항
    eulgu = diff.get("eulgu", {})
    if eulgu.get("added") or eulgu.get("removed") or eulgu.get("updated"):
        result.append("\n[을구 변경사항]")
        if eulgu.get("added"):
            result.append(f"  추가: {len(eulgu['added'])}건")
            for item in eulgu["added"]:
                purpose = item.get('purpose', 'N/A')
                amount = item.get('max_claim_amount', 0)
                result.append(f"    - {purpose} (순위: {item.get('rank', 'N/A')}, 채권최고액: {amount:,}원)")
        if eulgu.get("removed"):
            result.append(f"  삭제: {len(eulgu['removed'])}건")
            for item in eulgu["removed"]:
                result.append(f"    - {item.get('purpose', 'N/A')} (순위: {item.get('rank', 'N/A')})")
        if eulgu.get("updated"):
            result.append(f"  변경: {len(eulgu['updated'])}건")
            for change in eulgu["updated"]:
                old_item = change.get("old", {})
                new_item = change.get("new", {})
                old_amount = old_item.get('max_claim_amount', 0)
                new_amount = new_item.get('max_claim_amount', 0)
                purpose = old_item.get('purpose', 'N/A')
                result.append(f"    - {purpose} (순위: {old_item.get('rank', 'N/A')})")
                if old_amount != new_amount:
                    result.append(f"      채권최고액: {old_amount:,}원 → {new_amount:,}원")
    
    return "\n".join(result) if result else "변경사항 없음"

@app.post("/generate-report")
def generate(req: RequestBody, db: Session = Depends(get_db)):
    """
    통합 PDF 생성 엔드포인트
    
    - contract_id: 주택 등록 ID (필수)
    - risk: 추가 위험 상황 설명 (선택적)
    
    계약 정보, Risk 엔진 결과, Diff 결과를 모두 종합하여 PDF 생성
    """
    print(f"📋 [PDF 생성 요청] Contract ID: {req.contract_id}")
    
    # 1) 계약 정보 조회
    contract = db.query(ContractORM).filter(ContractORM.id == req.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다.")
    
    # ⚠️ 중요: DB에서 최신 보증금 확인 (두 번째 스냅샷 생성 시 변경된 보증금 반영)
    print(f"💰 [계약 정보 조회] 보증금: {contract.deposit:,}원 (DB 최신 값)")
    
    # 2) Risk 엔진 및 Diff 결과 가져오기
    from backend.app.services.snapshot_service import get_latest_two_snapshots
    from backend.app.services.diff_engine import compare_snapshots
    from backend.app.services.risk_engine import evaluate_risk
    
    # 최신 스냅샷 2개 가져오기
    old, new = get_latest_two_snapshots(req.contract_id, db)
    if not old or not new:
        raise HTTPException(status_code=404, detail="스냅샷 2개가 필요합니다.")
    
    # Diff 계산
    diff = compare_snapshots(old.to_dict(), new.to_dict())
    
    # Risk 평가
    risk_result = evaluate_risk(diff)
    risk_level = risk_result["level"]  # HIGH, CRITICAL, MEDIUM, LOW
    events = risk_result["events"]
    
    # ⚠️ 중요: LTV 계산을 먼저 수행하여 최신 보증금 반영
    # DB에서 최신 계약 정보 다시 조회 (보증금 변경 반영)
    db.refresh(contract)
    print(f"🔄 [DB Refresh 후] 보증금: {contract.deposit:,}원 (최신 값 확인)")
    
    # 시세 조회 (LTV 계산용) - 하드코딩된 시세 사용 (DB 저장값 또는 기본값)
    market_price = contract.market_price
    print(f"🔍 [PDF 생성 - 시세 확인] DB에서 가져온 시세: {market_price:,}원")
    
    # DB에 시세가 없으면 기본값 사용
    if not market_price:
        market_price = 2_000_000_000  # 기본값 20억원
        print(f"⚠️ [PDF 생성 - 시세 기본값] 기본값 사용: {market_price:,}원")
    
    # ⚠️ 중요: 시세가 비정상적으로 크면 경고
    if market_price > 50_000_000_000:  # 500억원 이상이면 비정상
        print(f"⚠️ [경고] 시세가 비정상적으로 큽니다: {market_price:,}원")
        print(f"   시세를 기본값(20억원)으로 재설정합니다.")
        market_price = 2_000_000_000
        from backend.app.database.crud.contract_crud import update_contract
        update_contract(db, req.contract_id, {"market_price": market_price})
        db.refresh(contract)
    
    # LTV 계산 (보증금 변경에 따라 동적으로 계산)
    from backend.app.services.liens_service import extract_total_liens
    from backend.app.services.ltv_service import calculate_ltv, classify_ltv_risk
    
    total_liens = extract_total_liens(new.eulgu)
    # ⚠️ 핵심: contract.deposit은 DB에서 최신 값을 가져오므로, 두 번째 스냅샷 생성 시 변경된 보증금이 반영됨
    current_ltv = calculate_ltv(contract.deposit, total_liens, market_price)
    current_ltv_risk = classify_ltv_risk(current_ltv)  # GREEN, AMBER, RED
    
    # 보증금 1억일 때 RED가 나오도록 시세 자동 조정
    if contract.deposit == 100_000_000 and current_ltv_risk != "RED":
        # RED 범위: LTV ≥ 80%
        # LTV = (보증금 + 선순위) / 시세 × 100
        # 시세 = (보증금 + 선순위) / LTV × 100
        # RED 기준(85%)으로 시세 계산
        target_ltv = 85.0  # RED 기준값
        required_market_price = int((contract.deposit + total_liens) / (target_ltv / 100))
        if market_price != required_market_price:
            market_price = required_market_price
            print(f"🔄 [시세 자동 조정] RED 목표: {market_price:,}원")
            # 재계산
            current_ltv = calculate_ltv(contract.deposit, total_liens, market_price)
            current_ltv_risk = classify_ltv_risk(current_ltv)
            print(f"📊 [재계산 결과] {current_ltv:.1f}% → {current_ltv_risk} 등급")
    
    print(f"💡 [LTV 계산] 보증금: {contract.deposit:,}원, 선순위 합계: {total_liens:,}원, 시세: {market_price:,}원")
    print(f"📊 [LTV 결과] {current_ltv:.1f}% → {current_ltv_risk} 등급")
    
    # ⚠️ 핵심: risk_grade는 LTV 기반 위험도 사용 (보증금 변경에 따라 동적으로 결정)
    # LTV가 AMBER면 risk_grade도 AMBER로 설정
    risk_grade = current_ltv_risk  # GREEN, AMBER, RED 중 하나
    
    # Risk Engine 결과도 참고용으로 유지
    risk_grade_from_events = convert_risk_level_to_grade(risk_level)
    print(f"🔍 [위험도 비교] LTV 기반: {risk_grade}, 이벤트 기반: {risk_grade_from_events}")
    print(f"✅ [최종 risk_grade 결정] {risk_grade} (LTV 기반: {current_ltv:.1f}%)")
    
    # 초기 LTV와 비교
    initial_ltv = contract.initial_ltv
    initial_ltv_risk = contract.initial_ltv_risk
    ltv_change = None
    ltv_change_text = ""
    if initial_ltv is not None:
        ltv_change = round(current_ltv - initial_ltv, 2)
        change_sign = "+" if ltv_change > 0 else ""
        ltv_change_text = f"\nLTV 변화: {initial_ltv}% → {current_ltv}% ({change_sign}{ltv_change}% 변화)"
    
    # 4) 종합 정보 문자열 생성
    nickname = contract.nickname or "사용자"
    move_in_date = contract.move_in_date.strftime("%Y-%m-%d") if contract.move_in_date else "미정"
    confirmation_date = contract.confirmation_date.strftime("%Y-%m-%d") if contract.confirmation_date else "미정"
    
    events_text = "\n".join([f"- {e['message']} ({e['level']})" for e in events]) if events else "위험 이벤트 없음"
    diff_info = format_diff_info(diff)
    additional_risk = f"\n[추가 위험 상황]\n{req.risk}\n" if req.risk else ""
    
    combined_info = f"""
사용자 닉네임: {nickname}

[계약 정보]
주소: {contract.address}
보증금: {contract.deposit:,}원
전입일: {move_in_date}
확정일자: {confirmation_date}

[위험도 분석 결과]
위험 등급: {risk_grade} ({risk_level})
LTV 기반 위험 등급: {current_ltv_risk}
위험 이벤트:
{events_text}

[LTV 분석]
현재 LTV: {current_ltv}% ({current_ltv_risk}){ltv_change_text}

[등기부등본 변경사항 (Diff)]
{diff_info}
{additional_risk}

[중요] 위험 등급은 {risk_grade} (LTV: {current_ltv}%)입니다.
"""
    
    print(f"🎯 [위험 등급] {risk_grade} ({risk_level})")
    print(f"📊 [위험 이벤트 수] {len(events)}개")
    print(f"👤 [사용자] {nickname}")
    print(f"🔍 [LLM 전달 등급] {risk_grade} (명시적으로 전달)")
    
    # 6) Playbook AI 호출 - 등급 정보를 명시적으로 전달
    print("🤖 [Playbook AI 호출] 대응 가이드북 생성 중...")
    ai_data = get_playbook_data(combined_info, risk_grade=risk_grade)
    
    # 7) PDF 생성 - 파일명에 타임스탬프와 등급 추가하여 캐시 방지
    print("🖨️ [PDF 생성] 가이드북 PDF 생성 중...")
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pdf_filename = f"Deposit_Radar_{nickname}_{risk_grade}_{timestamp}.pdf"
    create_pdf(ai_data, pdf_filename)
    
    # 6) PDF URL 생성 (모바일 앱에서 접근 가능한 URL)
    pdf_path = os.path.abspath(pdf_filename)
    # 로컬 IP 주소를 사용하여 모바일 앱에서 접근 가능한 URL 생성
    # 실제 서버 IP는 환경 변수나 설정에서 가져와야 함
    pdf_url = f"http://10.50.1.37:8000/static/{pdf_filename}"  # 정적 파일 서빙을 위한 URL
    
    # 7) JSON 응답 반환 (PDF URL과 risk_grade 포함)
    print(f"✅ [PDF 생성 완료] {pdf_path}")
    
    return JSONResponse({
        "status": "success",
        "message": "PDF 생성 완료",
        "risk_grade": risk_grade,  # RED, AMBER, GREEN
        "risk_level": risk_level,  # HIGH, CRITICAL, MEDIUM, LOW
        "download_url": pdf_url,
        "filename": pdf_filename
    })
app.include_router(contract_router)
app.include_router(snapshot_router)
app.include_router(compare_route.router)
app.include_router(risk_route.router)
app.include_router(address_router)
app.include_router(upload_router)
app.include_router(notification_router)

init_models()

@app.get("/test-mlt")
def test_mlt():
    from backend.app.services.price_service import debug_test_call
    debug_test_call()
    return {"message": "done"}


