# FastAPI 엔트리포인트 스켈레톤 파일.
from fastapi import FastAPI
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_route import router as registry_router
from backend.app.routes.registry_snapshot_route import router as snapshot_router
from backend.app.database.config import init_models

app = FastAPI(title="Deposit Rader", version="1.0.0")

app.include_router(contract_router)
app.include_router(registry_router)
app.include_router(snapshot_router)
init_models()