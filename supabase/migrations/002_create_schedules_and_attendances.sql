-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME DEFAULT '10:00',
  end_time TIME DEFAULT '13:00',
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendances table
CREATE TABLE IF NOT EXISTS attendances (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);

-- Disable RLS for development (enable in production)
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE schedules IS '경기 스케줄 정보';
COMMENT ON TABLE attendances IS '스케줄별 참석자 정보';
