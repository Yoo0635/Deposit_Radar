import fitz  # PyMuPDF
import cv2
import numpy as np
import os

from .clova.client import request_clova_ocr
from .normalize.parser import parse_registry_data
from .normalize.to_registry import convert_to_registry_snapshot

def run_ocr(file_path: str):
    """
    [OCR 파이프라인 총괄]
    PDF/이미지 입력 -> 네이버 전송 -> 텍스트 추출 -> 데이터 파싱 -> JSON 변환
    """
    print(f"OCR Engine: {file_path}")
    
    if not os.path.exists(file_path):
        return {"status": "error", "message": "파일을 찾을 수 없습니다."}

    accumulated_text = ""

    # PDF 파일
    if file_path.lower().endswith('.pdf'):
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)
            print(f"PDF 감지: 총 {total_pages}장")

            for i in range(total_pages):
                print(f"Page {i + 1} / {total_pages} 네이버 전송---")
                
                page = doc.load_page(i)
                
                # 해상도 2배 확대
                mat = fitz.Matrix(2, 2)
                pix = page.get_pixmap(matrix=mat)
                
                # penCV 포맷으로 변환
                img_data = np.frombuffer(pix.samples, dtype=np.uint8)
                img = img_data.reshape(pix.h, pix.w, pix.n)
                
                # RGB -> BGR 변환
                if pix.n >= 3:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

                # 네이버 API 호출
                clova_res = request_clova_ocr(img)
                
                if clova_res and 'images' in clova_res:
                    fields = clova_res['images'][0].get('fields', [])
                    page_text = " ".join([f['inferText'] for f in fields])
                    
                    accumulated_text += " " + page_text
                    print(f"{i+1}페이지 완료 ({len(page_text)}자)")
                else:
                    print(f"{i+1}페이지 인식 실패")
                    
        except Exception as e:
            print(f"PDF 처리 중 에러 발생: {e}")
            return {"status": "error", "message": f"PDF 처리 실패: {str(e)}"}

    # 이미지 파일
    else:
        print("이미지 파일 감지")
        try:
            img_array = np.fromfile(file_path, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                return {"status": "error", "message": "이미지 파일을 읽을 수 없습니다."}

            clova_res = request_clova_ocr(img)
            
            if clova_res and 'images' in clova_res:
                fields = clova_res['images'][0].get('fields', [])
                accumulated_text = " ".join([f['inferText'] for f in fields])
            else:
                return {"status": "error", "message": "OCR 인식 실패"}
                
        except Exception as e:
            print(f"이미지 처리 중 에러 발생: {e}")
            return {"status": "error", "message": f"이미지 처리 실패: {str(e)}"}

    # 데이터 파싱
    print(f"\n📦 전체 텍스트 수집 완료 (총 {len(accumulated_text)}자)")
    
    # parser.py
    raw_data = parse_registry_data(accumulated_text)
    print(f"핵심 데이터 추출: {raw_data}")


    # JSON 규격 변환
    # to_registry.py
    final_json = convert_to_registry_snapshot(raw_data)
    
    print(f"JSON 생성")
    return final_json