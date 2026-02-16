import { authHeaders } from "./auth";

const BASE = "http://localhost:8000/api";

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await fetch(`${BASE}/google/auth-url`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get auth URL");
  const data = await res.json();
  return data.auth_url;
}

export async function disconnectGoogle(): Promise<void> {
  const res = await fetch(`${BASE}/google/disconnect`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to disconnect Google");
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

export interface CreateEventParams {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  timezone?: string;
}

export async function listCalendarEvents(
  timeMin?: string,
  timeMax?: string
): Promise<{ items: CalendarEvent[] }> {
  const params = new URLSearchParams();
  if (timeMin) params.set("time_min", timeMin);
  if (timeMax) params.set("time_max", timeMax);

  const res = await fetch(`${BASE}/calendar/events?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}

export async function createCalendarEvent(
  event: CreateEventParams
): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create calendar event");
  return res.json();
}
