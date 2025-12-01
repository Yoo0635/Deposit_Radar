-- ============================================
-- Deposit Radar 데이터베이스 마이그레이션
-- 실행 날짜: 2025-12-01
-- ============================================
-- 
-- contract_info 테이블에 초기 LTV 관련 컬럼 추가
-- 및 move_in_date를 선택 필드로 변경
--
-- ============================================

-- 1. 초기 LTV 관련 컬럼 추가
ALTER TABLE contract_info 
ADD COLUMN IF NOT EXISTS initial_ltv FLOAT,
ADD COLUMN IF NOT EXISTS initial_ltv_risk VARCHAR(10),
ADD COLUMN IF NOT EXISTS initial_total_liens BIGINT,
ADD COLUMN IF NOT EXISTS initial_market_price BIGINT;

-- 2. move_in_date를 NULL 허용으로 변경 (이미 NULL 허용이면 오류 없음)
DO $$ 
BEGIN
    ALTER TABLE contract_info 
    ALTER COLUMN move_in_date DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- 이미 NULL 허용이거나 다른 오류면 무시
        NULL;
END $$;

-- ============================================
-- 마이그레이션 완료 후 확인 쿼리
-- ============================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'contract_info' 
-- ORDER BY ordinal_position;

