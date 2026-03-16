import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import appLogo from "@/assets/logo-shotapp.png";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: t('login.checkEmail'), description: t('login.confirmationSent') });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result?.error) {
        toast({ title: t('common.error'), description: String(result.error), variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src={appLogo} alt={t('login.appName')} className="h-10 w-10 rounded-xl shadow-glow object-cover" />
            <span className="text-xl font-black tracking-tight text-foreground">{t('login.appName')}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            {isSignUp ? t('login.createAccount') : t('login.welcomeBack')}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isSignUp ? t('login.startGenerating') : t('login.signInAccount')}
          </p>
        </div>

        <div className="bg-card/90 border border-border rounded-2xl p-8 shadow-elevated backdrop-blur-xl">
          <Button
            variant="outline"
            className="w-full h-12 mb-6 font-bold rounded-xl border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t('login.continueGoogle')}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground font-medium uppercase tracking-widest">{t('login.or')}</span></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('login.password')}</label>
                {!isSignUp && (
                  <button
                    onClick={async () => {
                      if (!email) { toast({ title: t('login.enterEmailFirst'), variant: "destructive" }); return; }
                      setSubmitting(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: window.location.origin + "/login",
                        });
                        if (error) throw error;
                        toast({ title: t('login.checkEmail'), description: t('login.resetSent') });
                      } catch (err: any) {
                        toast({ title: t('common.error'), description: err.message, variant: "destructive" });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    type="button"
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {isSignUp ? t('login.createAccountBtn') : t('login.signIn')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? t('login.alreadyAccount') : t('login.noAccount')}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold hover:underline">
              {isSignUp ? t('login.signIn') : t('login.signUp')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
