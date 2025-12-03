export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: number
          name: string
          phone: string | null
          email: string | null
          skill_level: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          name: string
          phone?: string | null
          email?: string | null
          skill_level?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          name?: string
          phone?: string | null
          email?: string | null
          skill_level?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: number
          date: string
          start_time: string
          end_time: string
          status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          date: string
          start_time: string
          end_time: string
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          date?: string
          start_time?: string
          end_time?: string
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendances: {
        Row: {
          id: number
          schedule_id: number
          member_id: number | null
          guest_name: string | null
          is_guest: boolean
          created_at: string
        }
        Insert: {
          id?: never
          schedule_id: number
          member_id?: number | null
          guest_name?: string | null
          is_guest?: boolean
          created_at?: string
        }
        Update: {
          id?: never
          schedule_id?: number
          member_id?: number | null
          guest_name?: string | null
          is_guest?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: number
          schedule_id: number
          match_number: number
          court: 'A' | 'B'
          start_time: string
          player1_id: number | null
          player2_id: number | null
          player3_id: number | null
          player4_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          schedule_id: number
          match_number: number
          court: 'A' | 'B'
          start_time: string
          player1_id?: number | null
          player2_id?: number | null
          player3_id?: number | null
          player4_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          schedule_id?: number
          match_number?: number
          court?: 'A' | 'B'
          start_time?: string
          player1_id?: number | null
          player2_id?: number | null
          player3_id?: number | null
          player4_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      constraints: {
        Row: {
          id: number
          schedule_id: number
          constraint_type: 'exclude_last_match' | 'partner_pair' | 'exclude_match'
          member_id_1: number | null
          member_id_2: number | null
          match_number: number | null
          created_at: string
        }
        Insert: {
          id?: never
          schedule_id: number
          constraint_type: 'exclude_last_match' | 'partner_pair' | 'exclude_match'
          member_id_1?: number | null
          member_id_2?: number | null
          match_number?: number | null
          created_at?: string
        }
        Update: {
          id?: never
          schedule_id?: number
          constraint_type?: 'exclude_last_match' | 'partner_pair' | 'exclude_match'
          member_id_1?: number | null
          member_id_2?: number | null
          match_number?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
