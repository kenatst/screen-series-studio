import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plans";

interface Profile {
  plan: PlanId;
  credits: number;
  subscriptionEnd?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: (userIdOverride?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
  checkSubscription: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("plan, credits")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile((prev) => ({
        plan: (data.plan as PlanId) ?? prev?.plan ?? "free",
        credits: typeof data.credits === "number" ? data.credits : (prev?.credits ?? 0),
        subscriptionEnd: prev?.subscriptionEnd ?? null,
      }));
    }
  }, []);

  const checkSubscription = useCallback(async (userIdOverride?: string) => {
    const targetUserId = userIdOverride ?? session?.user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        return;
      }

      if (data) {
        setProfile((prev) => ({
          plan: (data.plan ?? prev?.plan ?? "free") as PlanId,
          credits: typeof data.credits === "number" ? data.credits : (prev?.credits ?? 0),
          subscriptionEnd: data.subscription_end ?? prev?.subscriptionEnd ?? null,
        }));
      }
    } catch {
      // silently fail
    }
  }, [session?.user?.id]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Subscription first (server truth), then DB read to confirm persisted state
    await checkSubscription(userId);
    await fetchProfile(userId);
  }, [session?.user?.id, checkSubscription, fetchProfile]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    const hydrate = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);

      if (nextSession?.user?.id) {
        await checkSubscription(nextSession.user.id);
        await fetchProfile(nextSession.user.id);

        if (channel) await supabase.removeChannel(channel);

        // Setup realtime listener for profile changes (like credit usage)
        channel = supabase.channel('profile-updates')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${nextSession.user.id}` },
            (payload) => {
              setProfile((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  plan: (payload.new?.plan as PlanId) ?? prev.plan,
                  credits: typeof payload.new?.credits === "number" ? payload.new.credits : prev.credits,
                  subscriptionEnd: payload.new?.subscription_end ?? prev.subscriptionEnd,
                };
              });
            }
          )
          .subscribe();

      } else {
        setProfile(null);
        if (channel) {
          await supabase.removeChannel(channel);
          channel = null;
        }
      }

      if (mounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrate(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void hydrate(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkSubscription, fetchProfile]);

  // Sync on focus to keep billing state fresh without constant background polling.
  useEffect(() => {
    if (!session?.user?.id) return;

    const onFocus = () => {
      void refreshProfile();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [session?.user?.id, refreshProfile]);

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
