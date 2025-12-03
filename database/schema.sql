-- Tennis Club Schedule Management System Database Schema

-- Members Table
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    skill_level VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules Table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendances Table
CREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    guest_name VARCHAR(100),
    is_guest BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_member_or_guest CHECK (
        (is_guest = false AND member_id IS NOT NULL AND guest_name IS NULL) OR
        (is_guest = true AND member_id IS NULL AND guest_name IS NOT NULL)
    )
);

-- Matches Table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    match_number INTEGER NOT NULL CHECK (match_number BETWEEN 1 AND 6),
    court CHAR(1) NOT NULL CHECK (court IN ('A', 'B')),
    start_time TIME NOT NULL,
    player1_id INTEGER REFERENCES attendances(id),
    player2_id INTEGER REFERENCES attendances(id),
    player3_id INTEGER REFERENCES attendances(id),
    player4_id INTEGER REFERENCES attendances(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_match_per_schedule UNIQUE (schedule_id, match_number, court)
);

-- Constraints Table
CREATE TABLE constraints (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN ('exclude_last_match', 'partner_pair', 'exclude_match')),
    member_id_1 INTEGER REFERENCES members(id) ON DELETE CASCADE,
    member_id_2 INTEGER REFERENCES members(id) ON DELETE CASCADE,
    match_number INTEGER CHECK (match_number BETWEEN 1 AND 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_constraint_type_requirements CHECK (
        (constraint_type = 'exclude_last_match' AND member_id_1 IS NOT NULL AND member_id_2 IS NULL AND match_number IS NULL) OR
        (constraint_type = 'partner_pair' AND member_id_1 IS NOT NULL AND member_id_2 IS NOT NULL AND match_number IS NULL) OR
        (constraint_type = 'exclude_match' AND member_id_1 IS NOT NULL AND match_number IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX idx_attendances_member_id ON attendances(member_id);
CREATE INDEX idx_matches_schedule_id ON matches(schedule_id);
CREATE INDEX idx_constraints_schedule_id ON constraints(schedule_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
INSERT INTO members (name, phone, email, skill_level) VALUES
('홍길동', '010-1234-5678', 'hong@example.com', 'intermediate'),
('김철수', '010-2345-6789', 'kim@example.com', 'advanced'),
('이영희', '010-3456-7890', 'lee@example.com', 'beginner'),
('박민수', '010-4567-8901', 'park@example.com', 'intermediate'),
('정다은', '010-5678-9012', 'jung@example.com', 'advanced'),
('최민지', '010-6789-0123', 'choi@example.com', 'beginner'),
('강호동', '010-7890-1234', 'kang@example.com', 'intermediate'),
('유재석', '010-8901-2345', 'yoo@example.com', 'advanced');
