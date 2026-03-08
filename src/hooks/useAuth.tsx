import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plans";

interface Profile {
  plan: PlanId;
  credits: number;
  subscriptionEnd?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  checkSubscription: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("plan, credits")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(prev => ({
        plan: data.plan as PlanId,
        credits: data.credits,
        subscriptionEnd: prev?.subscriptionEnd,
      }));
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.warn("check-subscription error:", error);
        return;
      }
      if (data) {
        setProfile(prev => ({
          plan: (data.plan || prev?.plan || "free") as PlanId,
          credits: prev?.credits || 1,
          subscriptionEnd: data.subscription_end,
        }));
      }
    } catch (e) {
      console.warn("check-subscription failed:", e);
    }
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
      await checkSubscription();
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user?.id) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          // Check subscription after auth state change
          setTimeout(() => checkSubscription(), 500);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchProfile(session.user.id);
        setTimeout(() => checkSubscription(), 500);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic subscription check every 60s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
