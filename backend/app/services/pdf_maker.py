import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

def create_pdf(data, filename="result.pdf"):
    # 1. 경로 자동 계산 (가장 중요!)
    # 현재 파일 위치: .../backend/app/services/pdf_maker.py
    current_file = Path(__file__).resolve()
    
    # backend 폴더 위치 찾기 (services -> app -> backend)
    backend_dir = current_file.parent.parent.parent
    
    # assets 폴더와 templates 폴더 경로 설정
    assets_dir = backend_dir / "assets"
    template_dir = backend_dir / "app" / "templates"
    
    # 윈도우/맥 호환을 위해 file:/// 형태의 주소(URI)로 변환
    assets_url = assets_dir.as_uri()
    
    # 2. Jinja2 로딩 및 렌더링
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template('report.html')
    
    # ★ [핵심] assets_url 변수를 HTML 템플릿에 전달합니다!
    rendered_html = template.render(**data, assets_url=assets_url)
    
    # 3. PDF 변환
    HTML(string=rendered_html, base_url=str(backend_dir)).write_pdf(filename)
    print(f"📄 PDF 생성 완료: {filename}")
    return filename