import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, SettingsUpdate } from "../types/chat";
import {
  login as apiLogin,
  register as apiRegister,
  fetchCurrentUser,
  updateSettings,
  setToken,
  clearToken,
  getToken,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (settings: SettingsUpdate) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsAuthLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await apiRegister(email, password, displayName);
      setToken(res.token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (settings: SettingsUpdate) => {
    const updated = await updateSettings(settings);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await fetchCurrentUser();
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthLoading, login, register, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
