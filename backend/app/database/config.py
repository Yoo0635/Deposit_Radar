"""PostgreSQL 연결 설정 스켈레톤 파일.

SQLAlchemy 엔진 및 세션 팩토리 구성을 추후 추가합니다.
"""

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_models():
    # ⚠️ 반드시 모델들을 import 해야 create_all 이 테이블을 인식함
    import backend.app.models.contract_orm
    import backend.app.models.registry_snapshot_orm

    # 실제 테이블 생성
    Base.metadata.create_all(bind=engine)
