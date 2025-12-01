import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

# 환경 변수 로드
load_dotenv()

def _get_client():
    """OpenAI 클라이언트를 지연 초기화합니다."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.")
    return OpenAI(api_key=api_key)

def get_playbook_data(risk_info, risk_grade=None):
    """
    GPT-5-Nano(기획 모델)를 사용하여 대응 매뉴얼을 생성합니다.
    
    Args:
        risk_info: 위험 분석 정보 문자열
        risk_grade: 명시적으로 전달된 위험 등급 (RED, AMBER, GREEN)
    """
    
    # [1] 등급 감지 로직 - 명시적으로 전달된 등급 우선 사용
    if risk_grade and risk_grade in ["RED", "AMBER", "GREEN"]:
        current_grade = risk_grade
        print(f"✅ [LLM 엔진] 명시적 등급 사용: {current_grade}")
    else:
        # 문자열에서 등급 찾기 (하위 호환성)
        current_grade = "GREEN" 

        if "RED" in risk_info:
            current_grade = "RED"
        elif "AMBER" in risk_info:
            current_grade = "AMBER"
        elif "GREEN" in risk_info:
            current_grade = "GREEN"
        else:
            if "경매" in risk_info:
                current_grade = "RED"
            elif "가압류" in risk_info: 
                current_grade = "AMBER"
            elif "압류" in risk_info:    
                current_grade = "RED"
            elif "주의" in risk_info:
                current_grade = "AMBER"
        print(f"⚠️ [LLM 엔진] 문자열에서 등급 추출: {current_grade}")

    # [2] 등급별 맞춤형 가이드라인
    if current_grade == "RED":
        specific_guide = """
        - **상황**: 심각한 위험(경매 개시, 본압류 등). 보증금 회수 불능 위험.
        - **핵심 행동**: 법원 방문, 배당요구신청, 경매계 서류 열람, 변호사 선임 고려.
        - **체크리스트**: 아주 상세하게 쪼개라. (예: 법원 가기 전 준비물 챙기기 -> 법원 가기 -> 서류 쓰기)
        - **색상**: #D32F2F (빨강)
        """
    elif current_grade == "AMBER":
        specific_guide = """
        - **상황**: 잠재적 위험(가압류, 후순위 대출 등).
        - **핵심 행동**: 임대인 연락 및 재정상황 파악, 등기부 지속 모니터링.
        - **색상**: #FF8F00 (주황)
        """
    else: 
        specific_guide = """
        - **상황**: 단순 정보 변경. 안전함.
        - **색상**: #388E3C (초록)
        """

    # [3] 시스템 프롬프트 조립
    system_msg = f"""
    # Role
    너는 부동산 법률 전문가 AI다. 현재 분석된 위험 등급은 **[{current_grade}]** 이다.
    이 등급에 최적화된 대응 가이드북을 JSON으로 생성하라.

    # Guidelines for {current_grade}
    {specific_guide}

    # General Rules
    1. **Q&A**: 임차인이 가장 불안해할 질문 **5가지**를 예측하고 명확히 답변하라.
    2. **Glossary**: 리포트에 사용된 단어 중 일반인이 어려워할 법률 용어 3~4개를 골라 쉽게 풀이하라.
    3. **JSON Only**: 오직 표준 JSON 포맷으로만 응답하라.
    """

    # [5] 유저 프롬프트 (데이터 주입)
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    user_msg = f"""
    # [Input Data]
    {risk_info}

    # [Required JSON Schema]
    {{
        "meta": {{
            "title": "[보증금레이더] 임차인 수신 가이드북",
            "grade": "{current_grade}",
            "color": "색상 코드",
            "generated_at": "{current_time}"
        }},
        "user_name": "사용자이름",
        "content": {{
            "summary": "상황 요약 (3문장 이내)",
            "message_to_lessor": "임대인에게 보낼 문자 내용",
            
            "checklist": [
                "1단계 [준비]: ...",
                "2단계 [방문]: ...",
                "3단계 [작성]: ...",
                "4단계 [제출]: ...",
                "5단계 [확인]: ..."
            ],
            
            "glossary": [
                {{ "term": "용어1 (예: 배당요구종기일)", "definition": "쉬운 설명" }},
                {{ "term": "용어2 (예: 우선변제권)", "definition": "쉬운 설명" }},
                {{ "term": "용어3", "definition": "쉬운 설명" }}
            ],

            "qna_list": [
                {{ "question": "질문1", "answer": "답변1" }},
                {{ "question": "질문2", "answer": "답변2" }},
                {{ "question": "질문3", "answer": "답변3" }},
                {{ "question": "질문4", "answer": "답변4" }},
                {{ "question": "질문5", "answer": "답변5" }}
            ]
        }}
    }}
    """

    # [6] API 호출
    try:
        client = _get_client()
        print(f"🤖 Calling Model: gpt-5-nano for {current_grade} grade analysis...")
        response = client.chat.completions.create(
            model="gpt-5-nano", 
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            response_format={"type": "json_object"},
            #temperature=0.2
        )
        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"⚠️ Falling back to 'gpt-4o-mini' due to: {e}")
        try:
            client = _get_client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content)
            
        except Exception as e2:
            print(f"❌ Critical Error: {e2}")
            return {
                "meta": {"title": "[보증금레이더] 임차인 수신 가이드북", "grade": current_grade, "color": "#888888", "generated_at": current_time},
                "user_name": "사용자",
                "content": {
                    "summary": "오류 발생", 
                    "checklist": [], 
                    "glossary": [], 
                    "qna_list": [], 
                    "message_to_lessor": ""
                }
            }