export interface Member {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  skill_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
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
  court: 'A' | 'B';
  start_time: string;
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
  court: 'A' | 'B';
  start_time: string;
  team1: [Attendance, Attendance];
  team2: [Attendance, Attendance];
}
