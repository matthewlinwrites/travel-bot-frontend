import { useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface Props {
  threadId: number | null;
  onThreadUpdated: () => void;
}

export function Chat({ threadId, onThreadUpdated }: Props) {
  const { messages, isStreaming, isLoading, sendMessage } = useChat({
    threadId,
    onThreadUpdated,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen flex-1 flex-col bg-white dark:bg-gray-900">
      <header className="border-b px-6 py-4 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Travel Bot
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Plan your trip with AI assistance
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>
              {threadId === null
                ? "Create a new conversation to get started!"
                : "Tell me about your travel plans to get started!"}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming || threadId === null}
      />
    </div>
  );
}
