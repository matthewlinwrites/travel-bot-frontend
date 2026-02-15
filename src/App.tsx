import { useState, useEffect, useCallback } from "react";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import type { Thread } from "./types/chat";
import {
  fetchThreads,
  createThread,
  deleteThread,
  updateThreadTitle,
} from "./api/threads";

function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleNewThread = async () => {
    try {
      const thread = await createThread();
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
    } catch (err) {
      console.error("Failed to create thread:", err);
    }
  };

  const handleDeleteThread = async (id: number) => {
    try {
      await deleteThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  const handleRenameThread = async (id: number, title: string) => {
    try {
      const updated = await updateThreadTitle(id, title);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (err) {
      console.error("Failed to rename thread:", err);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
      />
      <Chat
        key={activeThreadId}
        threadId={activeThreadId}
        onThreadUpdated={loadThreads}
      />
    </div>
  );
}

export default App;
