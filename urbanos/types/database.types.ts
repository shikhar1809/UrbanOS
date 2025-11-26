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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'citizen' | 'agency' | 'admin'
          region: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'citizen' | 'agency' | 'admin'
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'citizen' | 'agency' | 'admin'
          region?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          type: 'pothole' | 'streetlight' | 'garbage' | 'cybersecurity' | 'other'
          title: string
          description: string
          location: {
            lat: number
            lng: number
            address: string
          }
          status: 'submitted' | 'received' | 'in-progress' | 'resolved' | 'rejected'
          priority: 'low' | 'medium' | 'high'
          images: string[]
          is_anonymous: boolean
          source: 'web' | 'instagram' | 'whatsapp' | 'twitter'
          agency_id: string | null
          submitted_at: string
          resolved_at: string | null
          response_time_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'pothole' | 'streetlight' | 'garbage' | 'cybersecurity' | 'other'
          title: string
          description: string
          location: {
            lat: number
            lng: number
            address: string
          }
          status?: 'submitted' | 'received' | 'in-progress' | 'resolved' | 'rejected'
          priority?: 'low' | 'medium' | 'high'
          images?: string[]
          is_anonymous?: boolean
          source?: 'web' | 'instagram' | 'whatsapp' | 'twitter'
          agency_id?: string | null
          submitted_at?: string
          resolved_at?: string | null
          response_time_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'pothole' | 'streetlight' | 'garbage' | 'cybersecurity' | 'other'
          title?: string
          description?: string
          location?: {
            lat: number
            lng: number
            address: string
          }
          status?: 'submitted' | 'received' | 'in-progress' | 'resolved' | 'rejected'
          priority?: 'low' | 'medium' | 'high'
          images?: string[]
          is_anonymous?: boolean
          source?: 'web' | 'instagram' | 'whatsapp' | 'twitter'
          agency_id?: string | null
          submitted_at?: string
          resolved_at?: string | null
          response_time_hours?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      agencies: {
        Row: {
          id: string
          name: string
          type: string
          email: string
          phone: string
          region: string
          avg_response_time_hours: number
          total_reports: number
          resolved_reports: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          email: string
          phone: string
          region: string
          avg_response_time_hours?: number
          total_reports?: number
          resolved_reports?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          email?: string
          phone?: string
          region?: string
          avg_response_time_hours?: number
          total_reports?: number
          resolved_reports?: number
          created_at?: string
          updated_at?: string
        }
      }
      community_officials: {
        Row: {
          id: string
          name: string
          role: string
          region: string
          responsibilities: string[]
          email: string
          phone: string
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          region: string
          responsibilities: string[]
          email: string
          phone: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          region?: string
          responsibilities?: string[]
          email?: string
          phone?: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      historical_incidents: {
        Row: {
          id: string
          type: string
          location: {
            lat: number
            lng: number
          }
          occurred_at: string
          severity: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          location: {
            lat: number
            lng: number
          }
          occurred_at: string
          severity?: 'low' | 'medium' | 'high'
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          location?: {
            lat: number
            lng: number
          }
          occurred_at?: string
          severity?: 'low' | 'medium' | 'high'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'report_update' | 'agency_response' | 'security_alert' | 'system'
          title: string
          message: string
          report_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'report_update' | 'agency_response' | 'security_alert' | 'system'
          title: string
          message: string
          report_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'report_update' | 'agency_response' | 'security_alert' | 'system'
          title?: string
          message?: string
          report_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      report_comments: {
        Row: {
          id: string
          report_id: string
          user_id: string
          comment: string
          is_agency: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          comment: string
          is_agency?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          comment?: string
          is_agency?: boolean
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

