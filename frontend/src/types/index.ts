export interface Member {
  id: number;
  club_id: number;
  user_id?: string;
  name: string;
  phone?: string;
  email?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  gender?: 'male' | 'female';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  club_id: number;
  date: string;
  start_time: string;
  end_time: string;
  match_type: 'mixed' | 'mens' | 'womens'; // 기본 매치 타입 (하위 호환성)
  match_types?: ('mixed' | 'mens' | 'womens')[]; // 경기별 타입 배열 (JSON)
  court_types?: ('mixed' | 'mens' | 'womens')[]; // 코트별 타입 배열 (JSON, 선택사항)
  total_matches: number; // 총 경기 수 (1-10)
  match_duration: number; // 경기당 시간 (분)
  court_count: number; // 코트 수 (1-10)
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  public_link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  schedule_id: number;
  member_id?: number;
  guest_name?: string;
  is_guest: boolean;
  created_at: string;
  member?: Member;
}

export interface Match {
  id: number;
  schedule_id: number;
  match_number: number;
  court: string; // 'A', 'B', 'C', ... 최대 10개
  start_time: string;
  match_type: 'mixed' | 'mens' | 'womens'; // 경기별 타입
  player1_id?: number;
  player2_id?: number;
  player3_id?: number;
  player4_id?: number;
  created_at: string;
  updated_at: string;
  player1?: Attendance;
  player2?: Attendance;
  player3?: Attendance;
  player4?: Attendance;
}

export interface Constraint {
  id: number;
  schedule_id: number;
  constraint_type: 'exclude_last_match' | 'partner_pair' | 'exclude_match';
  member_id_1?: number;
  member_id_2?: number;
  match_number?: number;
  created_at: string;
}

export interface ScheduleGenerationInput {
  attendees: Attendance[];
  constraints?: Constraint[];
  startTime: string;
}

export interface GeneratedMatch {
  match_number: number;
  court: string; // 'A', 'B', 'C', ... 최대 10개
  start_time: string;
  match_type: 'mixed' | 'mens' | 'womens';
  team1: [Attendance, Attendance];
  team2: [Attendance, Attendance];
}

// 경기 설정 인터페이스
export interface MatchSettings {
  totalMatches: number; // 총 경기 수 (1-10)
  matchDuration: number; // 경기당 시간 (분)
  courtCount: number; // 코트 수 (1-10)
  matchTypes: ('mixed' | 'mens' | 'womens')[]; // 경기별 타입 배열
  courtTypes?: ('mixed' | 'mens' | 'womens')[]; // 코트별 타입 배열 (선택사항, 없으면 경기 타입 사용)
}
