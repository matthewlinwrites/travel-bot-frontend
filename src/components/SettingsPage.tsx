import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getGoogleAuthUrl, disconnectGoogle } from "../api/google";

interface Props {
  onBack: () => void;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

const TRAVEL_STYLES = [
  "",
  "Adventure",
  "Relaxation",
  "Cultural",
  "Budget",
  "Luxury",
  "Family",
  "Solo",
];

export function SettingsPage({ onBack }: Props) {
  const { user, updateUser, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [language, setLanguage] = useState(user?.preferred_language ?? "en");
  const [travelStyle, setTravelStyle] = useState(user?.travel_style ?? "");
  const [icalUrl, setIcalUrl] = useState(user?.ical_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateUser({
        display_name: displayName,
        preferred_language: language,
        travel_style: travelStyle,
        ical_url: icalUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
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
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
          {/* Profile section */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Preferences section */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preferred language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default travel style
                </label>
                <select
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {TRAVEL_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s || "No preference"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Calendar section */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Calendar Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  iCal URL
                </label>
                <input
                  type="url"
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  placeholder="https://calendar.example.com/feed.ics"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Paste your iCal feed URL to sync travel dates (coming soon)
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Google Calendar
                </label>
                {user?.google_calendar_connected ? (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Connected
                    </span>
                    <button
                      type="button"
                      disabled={disconnecting}
                      onClick={async () => {
                        setDisconnecting(true);
                        try {
                          await disconnectGoogle();
                          await refreshUser();
                        } catch (err) {
                          console.error("Failed to disconnect:", err);
                        } finally {
                          setDisconnecting(false);
                        }
                      }}
                      className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {disconnecting ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const authUrl = await getGoogleAuthUrl();
                        window.location.href = authUrl;
                      } catch (err) {
                        console.error("Failed to get auth URL:", err);
                      }
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-500">Saved!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
