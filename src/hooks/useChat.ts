import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "../types/chat";
import { fetchMessages, updateThreadTitle } from "../api/threads";

const API_URL = "http://localhost:8000/api/chat";

interface UseChatOptions {
  threadId: number | null;
  onThreadUpdated?: () => void;
}

export function useChat({ threadId, onThreadUpdated }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load persisted messages when threadId changes
  useEffect(() => {
    if (threadId === null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchMessages(threadId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsStreaming(true);

      // Auto-title: if this is the first user message, set thread title
      const isFirstMessage = messages.length === 0;

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            thread_id: threadId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        // Auto-title after first message
        if (isFirstMessage && threadId !== null) {
          const title = content.slice(0, 60);
          await updateThreadTitle(threadId, title).catch(() => {});
          onThreadUpdated?.();
        } else {
          onThreadUpdated?.();
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, threadId, onThreadUpdated]
  );

  return { messages, isStreaming, isLoading, sendMessage };
}
