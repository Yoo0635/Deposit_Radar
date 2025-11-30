from ocr_engine.entry import run_ocr

# 파일 이름 작성
result = run_ocr("sample.pdf")
print("--- 결과 확인 ---")
print(result)