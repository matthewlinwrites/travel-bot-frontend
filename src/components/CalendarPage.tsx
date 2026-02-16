import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { listCalendarEvents, type CalendarEvent } from "../api/google";

interface Props {
  onBack: () => void;
}

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EVENT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.dateTime && !!event.start.date;
}

function getEventPosition(event: CalendarEvent): { top: number; height: number } {
  const start = new Date(event.start.dateTime!);
  const end = new Date(event.end.dateTime!);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = Math.max(endMinutes - startMinutes, 15);
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: (duration / 60) * HOUR_HEIGHT,
  };
}

function assignEventToDay(event: CalendarEvent, days: Date[]): number[] {
  if (isAllDay(event)) {
    const eventDate = new Date(event.start.date + "T00:00:00");
    return days.reduce<number[]>((acc, day, i) => {
      if (isSameDay(day, eventDate)) acc.push(i);
      return acc;
    }, []);
  }
  const start = new Date(event.start.dateTime!);
  return days.reduce<number[]>((acc, day, i) => {
    if (isSameDay(day, start)) acc.push(i);
    return acc;
  }, []);
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatEventTime(dateTime: string): string {
  const d = new Date(dateTime);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (first.getFullYear() !== last.getFullYear()) {
    return `${first.toLocaleDateString(undefined, { ...opts, year: "numeric" })} – ${last.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}, ${first.getFullYear()}`;
  }
  return `${first.toLocaleDateString(undefined, { month: "short" })} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
}

export function CalendarPage({ onBack }: Props) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [now, setNow] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  const days = getWeekDays(weekStart);
  const today = new Date();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to 7 AM on first load
  useEffect(() => {
    if (!scrolledRef.current && gridRef.current && !loading) {
      gridRef.current.scrollTop = 7 * HOUR_HEIGHT;
      scrolledRef.current = true;
    }
  }, [loading]);

  const fetchEvents = useCallback(async () => {
    if (!user?.google_calendar_connected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const timeMin = new Date(weekStart).toISOString();
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 7);
    const timeMax = endDate.toISOString();

    try {
      const data = await listCalendarEvents(timeMin, timeMax, 100);
      setEvents(data.items || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [user?.google_calendar_connected, weekStart]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigateWeek = (offset: number) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
    scrolledRef.current = false;
  };

  const goToToday = () => {
    setWeekStart(getMonday(new Date()));
    scrolledRef.current = false;
  };

  const allDayEvents = events.filter(isAllDay);
  const timedEvents = events.filter((e) => !isAllDay(e));

  // Group timed events by day column index
  const timedByDay: CalendarEvent[][] = days.map(() => []);
  timedEvents.forEach((event) => {
    const dayIndices = assignEventToDay(event, days);
    dayIndices.forEach((i) => timedByDay[i].push(event));
  });

  const allDayByDay: CalendarEvent[][] = days.map(() => []);
  allDayEvents.forEach((event) => {
    const dayIndices = assignEventToDay(event, days);
    dayIndices.forEach((i) => allDayByDay[i].push(event));
  });

  const hasAnyAllDay = allDayByDay.some((d) => d.length > 0);

  // Current time indicator position
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;
  const todayColIndex = days.findIndex((d) => isSameDay(d, today));

  // Color assignment by event id
  const colorMap = new Map<string, string>();
  events.forEach((event, i) => {
    if (!colorMap.has(event.id)) {
      colorMap.set(event.id, EVENT_COLORS[i % EVENT_COLORS.length]);
    }
  });

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-6 py-3 dark:border-gray-700">
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
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Google Calendar
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(-1)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatWeekRange(days)}
          </span>
        </div>
      </header>

      {/* Not connected warning */}
      {!user?.google_calendar_connected && (
        <div className="m-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          Google Calendar is not connected. Go to{" "}
          <button onClick={onBack} className="font-medium underline hover:no-underline">
            Settings
          </button>{" "}
          to connect your account.
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && user?.google_calendar_connected && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">Loading events...</p>
        </div>
      )}

      {/* Calendar grid */}
      {!loading && user?.google_calendar_connected && !error && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Day headers */}
          <div className="flex border-b dark:border-gray-700" style={{ paddingLeft: 64 }}>
            {days.map((day, i) => (
              <div
                key={i}
                className="flex-1 border-l py-2 text-center dark:border-gray-700"
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {DAY_LABELS[i]}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isSameDay(day, today)
                      ? "bg-blue-600 text-white"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* All-day events row */}
          {hasAnyAllDay && (
            <div className="flex border-b dark:border-gray-700" style={{ paddingLeft: 64 }}>
              {allDayByDay.map((dayEvents, i) => (
                <div key={i} className="flex-1 border-l p-1 dark:border-gray-700">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`mb-0.5 truncate rounded px-1.5 py-0.5 text-xs font-medium text-white ${colorMap.get(event.id) || "bg-blue-500"}`}
                      title={event.summary || "(No title)"}
                    >
                      {event.summary || "(No title)"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Time grid */}
          <div ref={gridRef} className="flex-1 overflow-y-auto">
            <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
              {/* Hour labels */}
              <div className="sticky left-0 z-10 w-16 shrink-0 bg-white dark:bg-gray-900">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative border-b border-gray-100 dark:border-gray-800"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {hour > 0 && (
                      <span className="absolute -top-2.5 right-2 text-xs text-gray-400 dark:text-gray-500">
                        {formatHour(hour)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="relative flex-1 border-l dark:border-gray-700">
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-gray-100 dark:border-gray-800"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Events */}
                  {timedByDay[dayIndex].map((event) => {
                    const { top, height } = getEventPosition(event);
                    const color = colorMap.get(event.id) || "bg-blue-500";
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1.5 py-0.5 text-xs text-white ${color}`}
                        style={{ top, height: Math.max(height, 18) }}
                        title={`${event.summary || "(No title)"}\n${formatEventTime(event.start.dateTime!)} – ${formatEventTime(event.end.dateTime!)}`}
                      >
                        <div className="truncate font-medium">
                          {event.summary || "(No title)"}
                        </div>
                        {height >= 36 && (
                          <div className="truncate opacity-90">
                            {formatEventTime(event.start.dateTime!)} – {formatEventTime(event.end.dateTime!)}
                          </div>
                        )}
                        {height >= 54 && event.location && (
                          <div className="truncate opacity-75">
                            {event.location}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {todayColIndex === dayIndex && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20"
                      style={{ top: nowTop }}
                    >
                      <div className="relative flex items-center">
                        <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-0.5 w-full bg-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
