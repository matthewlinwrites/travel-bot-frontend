import { useState, useRef, useEffect } from "react";
import type { Thread } from "../types/chat";

interface Props {
  threads: Thread[];
  activeThreadId: number | null;
  onSelectThread: (id: number) => void;
  onNewThread: () => void;
  onDeleteThread: (id: number) => void;
  onRenameThread: (id: number, title: string) => void;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
  onLogout: () => void;
  userDisplayName: string;
  googleCalendarConnected: boolean;
}

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  onOpenSettings,
  onOpenCalendar,
  onLogout,
  userDisplayName,
  googleCalendarConnected,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const startRename = (thread: Thread) => {
    setEditingId(thread.id);
    setEditValue(thread.title);
  };

  const commitRename = () => {
    if (editingId !== null && editValue.trim()) {
      onRenameThread(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="p-3">
        <button
          onClick={onNewThread}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          + New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => editingId !== thread.id && onSelectThread(thread.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startRename(thread);
            }}
            className={`group flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
              thread.id === activeThreadId
                ? "bg-gray-200 dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {editingId === thread.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                onBlur={commitRename}
                className="min-w-0 flex-1 rounded border border-blue-400 bg-white px-1 py-0.5 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
              />
            ) : (
              <span className="truncate text-gray-800 dark:text-gray-200">
                {thread.title}
              </span>
            )}

            {editingId !== thread.id && (
              <div className="ml-2 hidden shrink-0 items-center gap-1 group-hover:flex">
                {/* Rename button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(thread);
                  }}
                  className="rounded p-1 text-gray-400 hover:text-blue-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto border-t p-3 dark:border-gray-700">
        {googleCalendarConnected && (
          <button
            onClick={onOpenCalendar}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Calendar
          </button>
        )}
        <p className="mb-2 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
          {userDisplayName}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onOpenSettings}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Settings
          </button>
          <button
            onClick={onLogout}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
