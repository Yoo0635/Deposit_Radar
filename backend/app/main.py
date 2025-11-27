# FastAPI 엔트리포인트 스켈레톤 파일.
from fastapi import FastAPI
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_route import router as registry_router

app = FastAPI(title="Deposit Rader", version="1.0.0")

app.include_router(contract_router)
app.include_router(registry_router)