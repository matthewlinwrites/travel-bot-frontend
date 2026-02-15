export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Thread {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}
