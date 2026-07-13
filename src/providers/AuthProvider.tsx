import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "customer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestVersion = useRef(0);
  const mounted = useRef(true);

  const fetchProfile = async (user: User, version: number) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url, role, is_active, created_at, updated_at, last_login")
      .eq("id", user.id)
      .maybeSingle();

    if (!mounted.current || version !== requestVersion.current) return;

    if (error) {
      const profileError = new Error(`Unable to load profile: ${error.message}`);
      console.error(profileError);
      setProfile(null);
      setError(profileError);
      setLoading(false);
      return;
    }

    if (!data) {
      const profileError = new Error("No profile exists for the authenticated user.");
      console.error(profileError);
      setProfile(null);
      setError(profileError);
      setLoading(false);
      return;
    }

    setProfile(data as Profile);
    setError(null);
    setLoading(false);
  };

  const syncSession = (nextSession: Session | null) => {
    const version = ++requestVersion.current;
    setSession(nextSession);

    if (!nextSession) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchProfile(nextSession.user, version).catch((cause: unknown) => {
      if (!mounted.current || version !== requestVersion.current) return;
      const profileError = cause instanceof Error ? cause : new Error("Unable to load profile.");
      console.error(profileError);
      setProfile(null);
      setError(profileError);
      setLoading(false);
    });
  };

  const refreshProfile = async () => {
    if (!session) return;
    const version = ++requestVersion.current;
    setLoading(true);
    await fetchProfile(session.user, version);
  };

  useEffect(() => {
    mounted.current = true;
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"] | undefined;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!mounted.current) return;
        syncSession(data.session);
        subscription = supabase.auth.onAuthStateChange((_event, nextSession) => syncSession(nextSession)).data.subscription;
      })
      .catch((cause: unknown) => {
        if (!mounted.current) return;
        const sessionError = cause instanceof Error ? cause : new Error("Unable to restore the authentication session.");
        console.error(sessionError);
        setSession(null);
        setProfile(null);
        setError(sessionError);
        setLoading(false);
      });

    return () => {
      mounted.current = false;
      ++requestVersion.current;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, error, refreshProfile, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
