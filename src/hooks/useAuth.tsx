import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plans";
import i18n from "@/i18n";
import { normalizeUiLanguage, type UiLanguageCode } from "@/lib/ui-languages";

interface Profile {
  plan: PlanId;
  credits: number;
  subscriptionEnd?: string | null;
  preferredUiLanguage?: UiLanguageCode | null;
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
      .select("plan, credits, preferred_ui_language")
      .eq("id", userId)
      .single();

    if (data) {
      const nextLanguage = normalizeUiLanguage(data.preferred_ui_language);
      setProfile((prev) => ({
        plan: (data.plan as PlanId) ?? prev?.plan ?? "free",
        credits: typeof data.credits === "number" ? data.credits : (prev?.credits ?? 0),
        subscriptionEnd: prev?.subscriptionEnd ?? null,
        preferredUiLanguage: nextLanguage,
      }));
    }
  }, []);

  const checkSubscription = useCallback(async (userIdOverride?: string) => {
    const targetUserId = userIdOverride ?? session?.user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        await fetchProfile(targetUserId);
        console.error("[AUTH] check-subscription failed:", error.message);
        return;
      }

      if (data) {
        setProfile((prev) => ({
          plan: (data.plan ?? prev?.plan ?? "free") as PlanId,
          credits: typeof data.credits === "number" ? data.credits : (prev?.credits ?? 0),
          subscriptionEnd: data.subscription_end ?? prev?.subscriptionEnd ?? null,
          preferredUiLanguage: prev?.preferredUiLanguage ?? null,
        }));
      }
    } catch {
      await fetchProfile(targetUserId);
      console.error("[AUTH] check-subscription request failed");
    }
  }, [session?.user?.id, fetchProfile]);

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
                  preferredUiLanguage: payload.new?.preferred_ui_language
                    ? normalizeUiLanguage(payload.new.preferred_ui_language)
                    : prev.preferredUiLanguage,
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

  useEffect(() => {
    if (!session?.user?.id || !profile?.preferredUiLanguage) return;

    const currentLanguage = normalizeUiLanguage(i18n.resolvedLanguage ?? i18n.language);
    if (currentLanguage === profile.preferredUiLanguage) return;

    void i18n.changeLanguage(profile.preferredUiLanguage);
  }, [profile?.preferredUiLanguage, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const onLanguageChanged = async (language: string) => {
      const normalizedLanguage = normalizeUiLanguage(language);
      if (profile?.preferredUiLanguage === normalizedLanguage) return;

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          preferredUiLanguage: normalizedLanguage,
        };
      });

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_ui_language: normalizedLanguage })
        .eq("id", session.user.id);

      if (error) {
        console.error("[AUTH] Failed to persist UI language:", error.message);
      }
    };

    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [profile?.preferredUiLanguage, session?.user?.id]);

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
