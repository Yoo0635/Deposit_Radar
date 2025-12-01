import requests
import uuid
import time
import cv2
import json
#########네이버 클로바 OCR URL 및 KEY 등록 ###########
# env 인식 오류로 하드코딩
API_URL = "https://pd7lmck1u8.apigw.ntruss.com/custom/v1/48252/25c524c75073cdce82e8d317fcc38709ba139e85d44a788bfc8d5886e2813502/general"
SECRET_KEY = "SWxzYndUVmFUVFN6eFp1U29heG1sSUV2dEVxVnN5a0w="


def request_clova_ocr(image_numpy):
    """
    OpenCV 이미지(numpy)를 받아서 네이버 OCR API로 전송
    """
    print(f"전송 준비 URL: {API_URL[:30]}...")
    print(f"키 확인 Key: {SECRET_KEY[:5]}...")

    # 이미지 바이트 변환
    success, encoded_img = cv2.imencode('.jpg', image_numpy)
    if not success:
        raise ValueError("이미지 변환 실패 (OpenCV 문제)")
    
    file_bytes = encoded_img.tobytes()

    # 요청 메시지 구성 (네이버 규격)
    request_json = {
        "images": [{"format": "jpg", "name": "deposit_test"}],
        "requestId": str(uuid.uuid4()),
        "version": "V2",
        "timestamp": int(round(time.time() * 1000))
    }

    payload = {'message': json.dumps(request_json).strip()}
    files = [('file', file_bytes)]
    headers = {'X-OCR-SECRET': SECRET_KEY}

    try:
        print("네이버 클라우드(응답 기다리는 중...)")
        response = requests.post(API_URL, headers=headers, data=payload, files=files)
        
        # 결과 확인
        if response.status_code == 200:
            print("네이버 응답 확인")
            return response.json()
        elif response.status_code == 401:
            print("401 에러 키 인증 실패")
            print(f"응답 내용: {response.text}")
            return None
        else:
            print(f"에러 상태 코드: {response.status_code}")
            print(f"응답 내용: {response.text}")
            return None

    except Exception as e:
        print(f"전송 중 오류 발생: {e}")
        return None