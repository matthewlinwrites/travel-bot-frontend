import { authHeaders } from "./auth";

const API_URL = "http://localhost:8000/api/extract-locations";

export async function extractLocationNames(text: string): Promise<string[]> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    console.error("Failed to extract locations:", response.status);
    return [];
  }

  const data = await response.json();
  return data.locations ?? [];
}
