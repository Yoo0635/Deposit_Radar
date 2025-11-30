from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.llm_engine import get_playbook_data
from app.services.pdf_maker import create_pdf
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_snapshot_route import router as snapshot_router
from backend.app.database.config import init_models
from backend.app.routes import compare_route
from backend.app.routes import risk_route
from backend.app.database import models
from backend.app.routes.address_route import router as address_router

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
app.include_router(snapshot_router)
app.include_router(compare_route.router)
app.include_router(risk_route.router)
app.include_router(address_router)

init_models()

@app.get("/test-mlt")
def test_mlt():
    from backend.app.services.price_service import debug_test_call
    debug_test_call()
    return {"message": "done"}


