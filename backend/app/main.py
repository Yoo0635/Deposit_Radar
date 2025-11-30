from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.llm_engine import get_playbook_data
from app.services.pdf_maker import create_pdf
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_route import router as registry_router
from backend.app.routes.registry_snapshot_route import router as snapshot_router
from backend.app.database.config import init_models

app = FastAPI()

class RequestBody(BaseModel):
    name: str
    risk: str

@app.post("/generate-report")
def generate(req: RequestBody):
    print("🤖 AI 분석 중...")
    ai_data = get_playbook_data(f"사용자: {req.name}, 위험상황: {req.risk}")
    
    # [수정됨] 파일명 포맷 변경 (Deposit_Radar_이름_Guidebook.pdf)
    print("🖨️ PDF 가이드북 생성 중...")
    pdf_filename = f"Deposit_Radar_{req.name}_Guidebook.pdf"
    
    create_pdf(ai_data, pdf_filename)
    
    return FileResponse(pdf_filename, filename=pdf_filename)
app.include_router(contract_router)
app.include_router(registry_router)
app.include_router(snapshot_router)
init_models()
