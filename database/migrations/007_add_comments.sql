-- ============================================
-- 마이그레이션 7: 테이블 코멘트 추가
-- ============================================

COMMENT ON TABLE user_profiles IS '사용자 프로필 정보 (auth.users와 연결)';
COMMENT ON TABLE clubs IS '테니스 클럽 정보';
COMMENT ON TABLE club_members IS '사용자-클럽 관계 및 역할';
COMMENT ON TABLE members IS '클럽별 테니스 회원 정보';
COMMENT ON TABLE schedules IS '경기 스케줄 정보 (클럽별)';
COMMENT ON TABLE attendances IS '스케줄별 참석자 정보';
COMMENT ON TABLE matches IS '경기 배정 정보 (6경기, 2코트)';
COMMENT ON TABLE constraints IS '스케줄 생성 제약조건';



