# backend/app/routes/upload_route.py
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List
import os
import tempfile
from pathlib import Path

from backend.app.database.database import get_db
from backend.app.database.crud.contract_crud import get_contract_by_id
from backend.app.database.crud.registry_snapshot_crud import create_snapshot
from backend.app.schema.registry_snapshot_schema import RegistrySnapshotResponse, RegistryEntry
from ocr_engine.entry import run_ocr

router = APIRouter()

# 업로드된 파일을 저장할 임시 디렉토리
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=RegistrySnapshotResponse)
async def upload_and_process_ocr(
    contract_id: int = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    이미지 또는 PDF 파일 업로드 및 OCR 처리
    
    - contract_id: 주택 등록 시 생성된 계약 ID
    - files: 이미지 파일 (최대 2장) 또는 PDF 파일 (1개)
    """
    
    # 계약 존재 확인
    contract = get_contract_by_id(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="파일이 필요합니다.")
    
    # PDF와 이미지 파일 구분
    pdf_files = [f for f in files if f.filename and f.filename.lower().endswith('.pdf')]
    image_files = [f for f in files if not (f.filename and f.filename.lower().endswith('.pdf'))]
    
    # PDF가 있으면 PDF만 처리 (PDF와 이미지 동시 업로드 방지)
    if pdf_files:
        if len(pdf_files) > 1:
            raise HTTPException(status_code=400, detail="PDF 파일은 1개만 업로드 가능합니다.")
        if image_files:
            raise HTTPException(status_code=400, detail="PDF와 이미지를 동시에 업로드할 수 없습니다.")
    
    # 이미지 파일 개수 제한
    if image_files and len(image_files) > 2:
        raise HTTPException(status_code=400, detail="이미지 파일은 최대 2개까지 업로드 가능합니다.")
    
    accumulated_text = ""
    saved_files = []
    
    try:
        # 파일 저장 및 OCR 처리
        for file in files:
            # 파일 확장자 확인
            file_ext = Path(file.filename).suffix.lower() if file.filename else ""
            
            # 임시 파일 저장
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext, dir=UPLOAD_DIR)
            saved_files.append(temp_file.name)
            
            # 파일 내용 저장
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            
            print(f"파일 저장 완료: {temp_file.name}")
        
        # OCR 처리
        if pdf_files:
            # PDF 파일 처리 (run_ocr이 여러 페이지를 처리)
            print(f"PDF OCR 처리 시작: {saved_files[0]}")
            ocr_result = run_ocr(saved_files[0])
        else:
            # 이미지 파일 처리 (여러 이미지를 하나로 합쳐서 처리)
            print(f"이미지 OCR 처리 시작: {len(saved_files)}개 파일")
            
            # 여러 이미지의 OCR 텍스트를 합치기 위해 개별 처리 후 텍스트 추출
            from ocr_engine.normalize.parser import parse_registry_data
            from ocr_engine.clova.client import request_clova_ocr
            import cv2
            import numpy as np
            
            accumulated_text = ""
            
            # 각 이미지 파일을 개별적으로 OCR 처리하고 텍스트 합치기
            for img_file in saved_files:
                try:
                    print(f"이미지 OCR 처리: {img_file}")
                    # 이미지 파일 읽기
                    img_array = np.fromfile(img_file, np.uint8)
                    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    
                    if img is None:
                        print(f"이미지 파일을 읽을 수 없습니다: {img_file}")
                        continue
                    
                    # 네이버 Clova OCR API 호출
                    clova_res = request_clova_ocr(img)
                    
                    if clova_res and 'images' in clova_res:
                        fields = clova_res['images'][0].get('fields', [])
                        page_text = " ".join([f['inferText'] for f in fields])
                        accumulated_text += " " + page_text
                        print(f"이미지 OCR 완료: {len(page_text)}자 추출")
                    else:
                        print(f"이미지 OCR 실패: {img_file}")
                except Exception as e:
                    print(f"이미지 처리 중 오류 발생 ({img_file}): {e}")
                    continue
            
            # 합쳐진 텍스트로 최종 파싱 및 변환
            if not accumulated_text or len(accumulated_text.strip()) == 0:
                raise HTTPException(status_code=500, detail="OCR 처리 실패: 텍스트를 추출할 수 없습니다.")
            
            print(f"\n📦 전체 텍스트 수집 완료 (총 {len(accumulated_text)}자)")
            
            # 파싱 및 JSON 변환
            raw_data = parse_registry_data(accumulated_text)
            print(f"핵심 데이터 추출: {raw_data}")
            
            from ocr_engine.normalize.to_registry import convert_to_registry_snapshot
            ocr_result = convert_to_registry_snapshot(raw_data)
        
        # OCR 결과 확인
        if not ocr_result:
            raise HTTPException(status_code=500, detail="OCR 처리 실패: 결과가 없습니다.")
        
        # OCR 결과가 에러인 경우
        if isinstance(ocr_result, dict) and ocr_result.get('status') == 'error':
            raise HTTPException(status_code=500, detail=f"OCR 처리 실패: {ocr_result.get('message', '알 수 없는 오류')}")
        
        # OCR 결과 구조 확인 (convert_to_registry_snapshot이 반환하는 형태)
        # {viewed_at: str, gabu: list, eulgu: list}
        if not isinstance(ocr_result, dict) or 'viewed_at' not in ocr_result:
            raise HTTPException(status_code=500, detail="OCR 결과 형식이 올바르지 않습니다.")
        
        # Pydantic 모델로 변환
        gabu_entries = [RegistryEntry(**item) for item in ocr_result.get('gabu', [])]
        eulgu_entries = [RegistryEntry(**item) for item in ocr_result.get('eulgu', [])]
        
        # DB에 저장
        snapshot = create_snapshot(
            db=db,
            contract_id=contract_id,
            viewed_at=ocr_result['viewed_at'],
            gabu=gabu_entries,
            eulgu=eulgu_entries
        )
        
        # 첫 번째 스냅샷인지 확인 (해당 계약의 스냅샷이 1개면 첫 번째)
        # 주의: create_snapshot 후에 확인하므로, 새로 생성된 스냅샷 포함하여 1개면 첫 번째
        from backend.app.database.crud.registry_snapshot_crud import get_snapshot_by_contract_id
        existing_snapshots = get_snapshot_by_contract_id(db, contract_id)
        snapshot_count = len(existing_snapshots)
        is_first_snapshot = snapshot_count == 1
        
        print(f"📊 스냅샷 개수 확인: {snapshot_count}개 (첫 번째 스냅샷: {is_first_snapshot})")
        
        # 첫 번째 스냅샷이면 초기 LTV 계산 및 저장
        if is_first_snapshot:
            print(f"🔢 초기 LTV 계산 시작 (Contract ID: {contract_id})")
            from backend.app.services.liens_service import extract_total_liens
            from backend.app.services.ltv_service import calculate_ltv, classify_ltv_risk
            from backend.app.services.price_service import fetch_market_price_by_jibun
            
            # 담보총액 계산
            total_liens = extract_total_liens(eulgu_entries)
            print(f"💰 담보총액: {total_liens:,}원")
            
            # 시세 조회
            if contract.address_jibun:
                print(f"🏠 시세 조회 시도: {contract.address_jibun}")
                market_price = fetch_market_price_by_jibun(contract.address_jibun)
                if market_price is None:
                    # 시세 조회 실패 시 계약 정보의 market_price 사용 (하드코딩된 값)
                    market_price = contract.market_price or 2_000_000_000
                    print(f"⚠️ 시세 조회 실패, 기본값 사용: {market_price:,}원")
                else:
                    print(f"✅ 시세 조회 성공: {market_price:,}원")
            else:
                market_price = contract.market_price or 2_000_000_000
                print(f"📌 기본 시세 사용: {market_price:,}원")
            
            # LTV 계산
            initial_ltv = calculate_ltv(contract.deposit, total_liens, market_price)
            initial_ltv_risk = classify_ltv_risk(initial_ltv)
            print(f"📊 LTV 계산 결과: {initial_ltv}% (위험도: {initial_ltv_risk})")
            
            # 계약 정보에 초기 LTV 저장
            from backend.app.database.crud.contract_crud import update_contract
            updated_contract = update_contract(db, contract_id, {
                "initial_ltv": initial_ltv,
                "initial_ltv_risk": initial_ltv_risk,
                "initial_total_liens": total_liens,
                "initial_market_price": market_price
            })
            
            if updated_contract:
                print(f"✅ 초기 LTV 저장 완료: {initial_ltv}% ({initial_ltv_risk})")
                print(f"   - 담보총액: {total_liens:,}원")
                print(f"   - 시세: {market_price:,}원")
                print(f"   - 보증금: {contract.deposit:,}원")
            else:
                print(f"❌ 초기 LTV 저장 실패: update_contract가 None 반환")
        else:
            print(f"⏭️ 첫 번째 스냅샷이 아니므로 LTV 계산 건너뜀 (스냅샷 개수: {snapshot_count})")
        
        # Response 생성
        return RegistrySnapshotResponse(
            id=snapshot.id,
            contract_id=snapshot.contract_id,
            viewed_at=snapshot.viewed_at.strftime("%Y-%m-%d") if hasattr(snapshot.viewed_at, 'strftime') else str(snapshot.viewed_at),
            gabu=[RegistryEntry(**item) for item in snapshot.gabu],
            eulgu=[RegistryEntry(**item) for item in snapshot.eulgu]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"OCR 처리 중 오류 발생: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"OCR 처리 중 오류 발생: {str(e)}")
    finally:
        # 임시 파일 삭제
        for file_path in saved_files:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"임시 파일 삭제 실패: {file_path}, 오류: {e}")

