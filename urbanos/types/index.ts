export type ReportType = 'pothole' | 'streetlight' | 'garbage' | 'animal_carcass' | 'cybersecurity' | 'cyber' | 'road_safety_hazards' | 'public_infrastructure' | 'environmental' | 'health_safety' | 'other';
export type ReportStatus = 'submitted' | 'received' | 'in-progress' | 'resolved' | 'rejected';
export type ReportPriority = 'low' | 'medium' | 'high';
export type UserRole = 'citizen' | 'agency' | 'admin';
export type ReportSource = 'web' | 'instagram' | 'whatsapp' | 'twitter';
export type NotificationType = 'report_update' | 'agency_response' | 'security_alert' | 'system';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  title: string;
  description: string;
  location: Location & { areaPin?: string };
  status: ReportStatus;
  priority: ReportPriority;
  images: string[];
  videos?: string[];
  is_anonymous: boolean;
  source: ReportSource;
  agency_id: string | null;
  authority_ids?: string[];
  submitted_at: string;
  resolved_at: string | null;
  response_time_hours: number | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  region: string;
  avg_response_time_hours: number;
  total_reports: number;
  resolved_reports: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityOfficial {
  id: string;
  name: string;
  role: string;
  region: string;
  responsibilities: string[];
  email: string;
  phone: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  report_id: string | null;
  read: boolean;
  created_at: string;
}

export interface HistoricalIncident {
  id: string;
  type: string;
  location: {
    lat: number;
    lng: number;
  };
  occurred_at: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface RiskZone {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  risk_level: 'low' | 'medium' | 'high';
  incident_count: number;
  predicted_issues: string[];
}

export interface LocalChapter {
  id: string;
  name: string;
  type: string;
  description: string | null;
  region: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  achievements: string[];
  awards: string[];
  bio: string | null;
  photo_url: string | null;
  chapter_id: string | null;
  recognition_level: 'low' | 'medium' | 'high';
  region: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionRoom {
  id: string;
  name: string;
  description: string | null;
  type: 'chat' | 'forum';
  category: string | null;
  region: string | null;
  created_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscussionMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: 'chat' | 'post';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscussionReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'upvote' | 'like' | 'dislike';
  created_at: string;
}

export interface CommunityServiceOpportunity {
  id: string;
  title: string;
  description: string;
  organization: string | null;
  location: Location;
  date: string | null;
  duration: string | null;
  required_skills: string[];
  contact_info: {
    email?: string;
    phone?: string;
  } | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollutionData {
  id: string;
  location: Location & { area_name?: string };
  pollution_type: 'air' | 'water' | 'noise' | 'soil';
  level: number;
  aqi_value: number | null;
  pm25_aqi: number | null;
  pm10_aqi: number | null;
  o3_aqi: number | null;
  no2_aqi: number | null;
  so2_aqi: number | null;
  co_aqi: number | null;
  source: 'user_report' | 'api';
  report_id: string | null;
  timestamp: string;
  created_at: string;
}

