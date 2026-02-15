import type { ChatMessage, Thread } from "../types/chat";

const BASE = "http://localhost:8000/api";

export async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch(`${BASE}/threads`);
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function createThread(): Promise<Thread> {
  const res = await fetch(`${BASE}/threads`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function deleteThread(id: number): Promise<void> {
  const res = await fetch(`${BASE}/threads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export async function fetchMessages(threadId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/threads/${threadId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function updateThreadTitle(
  id: number,
  title: string
): Promise<Thread> {
  const res = await fetch(`${BASE}/threads/${id}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}
