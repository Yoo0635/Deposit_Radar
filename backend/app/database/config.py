"""PostgreSQL 연결 설정 스켈레톤 파일.

SQLAlchemy 엔진 및 세션 팩토리 구성을 추후 추가합니다.
"""
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()