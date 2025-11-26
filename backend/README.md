# backend

Deposit Radar의 **메인 백엔드 서비스**가 들어갈 영역입니다.
FastAPI + PostgreSQL(SQLAlchemy) 조합을 기본 전제로 합니다.

현재는 **스켈레톤 구조와 설명용 주석만 존재**하며,
실제 동작 로직은 전혀 구현되어 있지 않습니다.

---

## 1. 디렉토리 구조

```bash
backend/
├── app/
│   ├── main.py                # FastAPI 엔트리포인트 (스켈레톤)
│   ├── models/                # Pydantic 모델 (스켈레톤)
│   ├── routes/                # API 엔드포인트 (스켈레톤)
│   ├── services/              # 비즈니스 로직 (스켈레톤)
│   ├── database/              # DB 설정/ORM/레포지토리 (스켈레톤)
│   └── utils/                 # 공용 유틸리티 (스켈레톤)
├── requirements.txt           # 백엔드 Python 의존성 목록
└── README.md
```

각 모듈의 세부 역할은 루트 `README.md`의 모노레포 구조 설명을 참고하세요.

---

## 2. 구현 시 주의사항

- 이 레포는 **구조 합의용 템플릿**입니다.
- `main.py`, `routes/*`, `models/*`, `services/*`, `database/*` 파일 안에는
  설명용 주석/문자열 외에 **어떠한 실제 코드도 들어있지 않습니다.**
- FastAPI 앱 생성, 라우터 등록, DB 세션 관리, Diff/Risk 엔진 로직 등은
  팀이 직접 설계/구현해야 합니다.

백엔드를 구현하면서 구조가 바뀌더라도, 가능하면 이 README를 함께 업데이트해서
다른 파트(모바일, OCR, 브릿지 등) 담당자들이 백엔드 구조를 쉽게 따라올 수 있게 해 주세요.

