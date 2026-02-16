import { useState, useEffect, useCallback, useRef } from "react";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { MapPanel } from "./components/MapPanel";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { SettingsPage } from "./components/SettingsPage";
import { CalendarPage } from "./components/CalendarPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { Thread } from "./types/chat";
import {
  fetchThreads,
  createThread,
  deleteThread,
  updateThreadTitle,
} from "./api/threads";

type View = "login" | "register" | "chat" | "settings" | "calendar";

function AppContent() {
  const { user, isAuthLoading, logout, refreshUser } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<View>("login");
  const [locationNames, setLocationNames] = useState<string[]>([]);
  const clearLocationsRef = useRef<() => void>(() => {});

  const loadThreads = useCallback(async () => {
    try {
      const data = await fetchThreads();
      setThreads(data);
      // Auto-select the first thread if none is active
      setActiveThreadId((current) => {
        if (current !== null) return current;
        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }, []);

  // Handle Google OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setCurrentView("settings");
      refreshUser();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshUser]);

  // Load threads when user logs in
  useEffect(() => {
    if (user) {
      if (currentView === "login" || currentView === "register") {
        setCurrentView("chat");
      }
      loadThreads();
    } else {
      setThreads([]);
      setActiveThreadId(null);
      setCurrentView("login");
    }
  }, [user, loadThreads]);

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
      setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error("Failed to rename thread:", err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Loading state while checking stored token
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Not logged in — show auth pages
  if (!user) {
    if (currentView === "register") {
      return <RegisterPage onSwitchToLogin={() => setCurrentView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setCurrentView("register")} />;
  }

  // Settings page
  if (currentView === "settings") {
    return <SettingsPage onBack={() => setCurrentView("chat")} />;
  }

  // Calendar page
  if (currentView === "calendar") {
    return <CalendarPage onBack={() => setCurrentView("chat")} />;
  }

  // Main chat view with split panel
  return (
    <div className="flex h-screen">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        onOpenSettings={() => setCurrentView("settings")}
        onOpenCalendar={() => setCurrentView("calendar")}
        onLogout={handleLogout}
        userDisplayName={user.display_name || user.email}
        googleCalendarConnected={user.google_calendar_connected}
      />
      <div className="flex flex-1 min-w-0">
        <div className="w-[55%]">
          <Chat
            key={activeThreadId}
            threadId={activeThreadId}
            onThreadUpdated={loadThreads}
            onLocationNamesChange={setLocationNames}
            onClearLocationsRef={(fn) => { clearLocationsRef.current = fn; }}
          />
        </div>
        <div className="w-[45%] border-l dark:border-gray-700">
          <MapPanel locationNames={locationNames} onClear={() => clearLocationsRef.current()} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
