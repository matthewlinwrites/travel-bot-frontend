import type { ChatMessage, Thread } from "../types/chat";
import { authHeaders } from "./auth";

const BASE = "http://localhost:8000/api";

export async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch(`${BASE}/threads`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function createThread(): Promise<Thread> {
  const res = await fetch(`${BASE}/threads`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function deleteThread(id: number): Promise<void> {
  const res = await fetch(`${BASE}/threads/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export async function fetchMessages(threadId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/threads/${threadId}/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function updateThreadTitle(
  id: number,
  title: string
): Promise<Thread> {
  const res = await fetch(`${BASE}/threads/${id}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}

export async function generateThreadTitle(
  id: number,
  message: string
): Promise<Thread> {
  const res = await fetch(`${BASE}/threads/${id}/generate-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to generate title");
  return res.json();
}
