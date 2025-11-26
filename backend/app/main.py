# FastAPI 엔트리포인트 스켈레톤 파일.
from fastapi import FastAPI
from app.routes.health import router as health_router

app = FastAPI(title="Deposit Rader", version="1.0.0")

app.include_router(health_router)
