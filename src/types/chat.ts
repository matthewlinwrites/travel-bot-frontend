export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Thread {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  display_name: string;
  preferred_language: string;
  travel_style: string;
  ical_url: string;
  google_calendar_connected: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SettingsUpdate {
  display_name?: string;
  preferred_language?: string;
  travel_style?: string;
  ical_url?: string;
  google_calendar_connected?: boolean;
}
