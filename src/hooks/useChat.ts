import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "../types/chat";
import { authHeaders } from "../api/auth";
import { fetchMessages, generateThreadTitle } from "../api/threads";
import { extractLocationNames } from "../api/locations";

const API_URL = "http://localhost:8000/api/chat";

interface UseChatOptions {
  threadId: number | null;
  onThreadUpdated?: () => void;
}

export function useChat({ threadId, onThreadUpdated }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationNames, setLocationNames] = useState<string[]>([]);

  // Load persisted messages when threadId changes
  useEffect(() => {
    if (threadId === null) {
      setMessages([]);
      setLocationNames([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setLocationNames([]);
    fetchMessages(threadId)
      .then(async (msgs) => {
        if (cancelled) return;
        setMessages(msgs);

        // Extract location names from all existing assistant messages
        const assistantTexts = msgs
          .filter((m) => m.role === "assistant")
          .map((m) => m.content);
        if (assistantTexts.length > 0) {
          const combinedText = assistantTexts.join("\n\n");
          const names = await extractLocationNames(combinedText);
          if (!cancelled) setLocationNames(names);
        }
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const addLocationNames = useCallback((newNames: string[]) => {
    setLocationNames((prev) => {
      const seen = new Set(prev);
      const unique = newNames.filter((n) => !seen.has(n));
      return unique.length > 0 ? [...prev, ...unique] : prev;
    });
  }, []);

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
          headers: { "Content-Type": "application/json", ...authHeaders() },
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
                if (parsed.tool_call) {
                  // Show a status message while the tool executes
                  const toolName = parsed.tool_call.name;
                  const toolArgs = parsed.tool_call.arguments;
                  const statusText =
                    toolName === "create_calendar_event"
                      ? `Creating calendar event: ${toolArgs.summary || "event"}...\n\n`
                      : `Running ${toolName}...\n\n`;
                  assistantContent += statusText;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                    };
                    return updated;
                  });
                } else {
                  assistantContent += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                    };
                    return updated;
                  });
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        // Extract location names from the completed assistant response
        if (assistantContent) {
          extractLocationNames(assistantContent)
            .then((names) => addLocationNames(names))
            .catch((err) =>
              console.error("Failed to extract locations:", err)
            );
        }

        // Auto-title after first message using LLM
        if (isFirstMessage && threadId !== null) {
          generateThreadTitle(threadId, content)
            .then(() => onThreadUpdated?.())
            .catch(() => onThreadUpdated?.());
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
    [messages, threadId, onThreadUpdated, addLocationNames]
  );

  const clearLocations = useCallback(() => {
    setLocationNames([]);
  }, []);

  return { messages, isStreaming, isLoading, sendMessage, locationNames, clearLocations };
}
