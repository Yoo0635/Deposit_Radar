# FastAPI 엔트리포인트 스켈레톤 파일.
from fastapi import FastAPI
from backend.app.routes.contract_route import router as contract_router
from backend.app.routes.registry_snapshot_route import router as snapshot_router
from backend.app.database.config import init_models
from backend.app.routes import compare_route
from backend.app.routes import risk_route
from backend.app.database import models


app = FastAPI(title="Deposit Rader", version="1.0.0")

app.include_router(contract_router)
app.include_router(snapshot_router)
app.include_router(compare_route.router)
app.include_router(risk_route.router)

init_models()