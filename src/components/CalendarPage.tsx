import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { listCalendarEvents, type CalendarEvent } from "../api/google";

interface Props {
  onBack: () => void;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(dateTime?: string, date?: string): string {
  if (dateTime) {
    return new Date(dateTime).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (date) {
    return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return "";
}

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.dateTime && !!event.start.date;
}

const RANGE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export function CalendarPage({ onBack }: Props) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const [startDate, setStartDate] = useState(toDateInputValue(today));
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))
  );

  const fetchEvents = useCallback(async () => {
    if (!user?.google_calendar_connected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const timeMin = new Date(startDate + "T00:00:00").toISOString();
    const timeMax = new Date(endDate + "T23:59:59").toISOString();

    try {
      const data = await listCalendarEvents(timeMin, timeMax);
      setEvents(data.items || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [user?.google_calendar_connected, startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const applyPreset = (days: number) => {
    const now = new Date();
    setStartDate(toDateInputValue(now));
    setEndDate(
      toDateInputValue(new Date(now.getTime() + days * 24 * 60 * 60 * 1000))
    );
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      <header className="flex items-center gap-4 border-b px-6 py-4 dark:border-gray-700">
        <button
          onClick={onBack}
          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Google Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {events.length} event{events.length !== 1 ? "s" : ""} in selected range
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {!user?.google_calendar_connected && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
              Google Calendar is not connected. Go to{" "}
              <button
                onClick={onBack}
                className="font-medium underline hover:no-underline"
              >
                Settings
              </button>{" "}
              to connect your account.
            </div>
          )}

          {user?.google_calendar_connected && (
            <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-1.5">
                  {RANGE_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      onClick={() => applyPreset(preset.days)}
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">Loading events...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && user?.google_calendar_connected && events.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No events in the selected date range.
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {event.summary || "(No title)"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {isAllDay(event) ? (
                          <span>
                            {formatTime(undefined, event.start.date)}
                            {" — All day"}
                          </span>
                        ) : (
                          <span>
                            {formatTime(event.start.dateTime)} —{" "}
                            {formatTime(event.end.dateTime)}
                          </span>
                        )}
                      </p>
                      {event.location && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {isAllDay(event) && (
                      <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        All day
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
