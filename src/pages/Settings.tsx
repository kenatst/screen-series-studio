import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getPlanById, CREDIT_COSTS } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useBilling } from "@/hooks/useBilling";
import { motion } from "framer-motion";
import { Crown, CheckCircle2, Loader2, CreditCard, ExternalLink, RefreshCw, User, Coins, Lock, AlertTriangle, LogOut } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

const Settings_Page = () => {
  const { profile, checkSubscription, user, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { handleUpgrade, handleManageSubscription, isOpeningPortal, isUpgrading } = useBilling();
  const { t } = useTranslation();

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const plan = getPlanById(profile?.plan || "free");
  const credits = profile?.credits ?? 0;

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: t('settings.paymentSuccess'), description: t('settings.subActive') });
      setTimeout(() => { checkSubscription(); refreshProfile(); }, 2000);
    }
  }, [checkSubscription, refreshProfile, searchParams, t, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkSubscription();
    await refreshProfile();
    setIsRefreshing(false);
    toast({ title: t('dashboard.statusUpdated') });
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: t('settings.passwordTooShort'), description: t('settings.minChars'), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('settings.passwordNoMatch'), variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t('settings.passwordUpdated'), description: t('settings.passwordUpdatedDesc') });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast({
        title: t('settings.accountDeleted'),
        description: t('settings.accountDeletedDesc'),
      });
    } catch (e: any) {
      toast({
        title: t('settings.deletionFailed'),
        description: e.message || "Please contact support.",
        variant: "destructive",
      });
    }
    setIsDeletingAccount(false);
    setShowDeleteDialog(false);
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-1">{t('settings.title')}</h1>
          <p className="text-muted-foreground font-medium mb-10">{t('settings.subtitle')}</p>
        </motion.div>

        {/* Credits Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-card/80 backdrop-blur-sm p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-bl-[120px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-glow">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">{t('settings.credits')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.generationBalance')}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-6xl font-black text-primary">{credits}</span>
              <span className="text-xl text-muted-foreground font-bold">{t('settings.creditsRemaining')}</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-card/90 border border-border p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('settings.generation')}</p>
                <p className="text-lg font-black text-foreground">{CREDIT_COSTS.generateSlide} cr. <span className="text-sm font-medium text-muted-foreground">{t('settings.perSlide')}</span></p>
              </div>
              <div className="rounded-xl bg-card/90 border border-border p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('settings.regeneration')}</p>
                <p className="text-lg font-black text-foreground">{CREDIT_COSTS.regenerateSlide} cr. <span className="text-sm font-medium text-muted-foreground">{t('settings.perSlide')}</span></p>
              </div>
              <div className="rounded-xl bg-card/90 border border-border p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('settings.translation')}</p>
                <p className="text-lg font-black text-foreground">{CREDIT_COSTS.translateSlide} cr. <span className="text-sm font-medium text-muted-foreground">{t('settings.perSlide')}</span></p>
              </div>
              <div className="rounded-xl bg-card/90 border border-border p-4">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('settings.suggestions')}</p>
                <p className="text-lg font-black text-foreground">{CREDIT_COSTS.suggestCopy} cr. <span className="text-sm font-medium text-muted-foreground">{t('settings.perRequest')}</span></p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your <span className="font-bold text-primary">{plan.name}</span> plan includes <span className="font-bold text-foreground">{plan.monthlyCredits} credits/mo</span>.
              {plan.id === 'free' && ` ${t('settings.upgradePrompt')}`}
            </p>
          </div>
        </motion.div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black tracking-tight text-foreground">{plan.name}</h2>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold uppercase">{t('settings.active')}</Badge>
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-3xl font-black text-foreground">{plan.priceValue === 0 ? "€0" : plan.price}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {plan.features.map(f => (
              <div key={f} className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {profile?.plan !== "free" ? (
              <Button onClick={handleManageSubscription} disabled={isOpeningPortal} variant="outline" className="rounded-xl">
                {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {t('settings.manageSub')}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/#pricing'} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {t('settings.upgradePlan')}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="ghost" className="rounded-xl">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {t('settings.refresh')}
            </Button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card/50 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t('settings.account')}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('settings.email')}</span>
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('settings.plan')}</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{plan.name}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('settings.credits')}</span>
              <span className="text-sm font-bold text-primary">{credits}</span>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card/50 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t('settings.changePassword')}</h2>
          </div>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.newPassword')}</label>
              <Input
                type="password"
                placeholder={t('settings.minChars')}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="rounded-xl border-border bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.confirmPassword')}</label>
              <Input
                type="password"
                placeholder={t('settings.repeatPassword')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="rounded-xl border-border bg-background/50"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="rounded-xl"
            >
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {t('settings.updatePassword')}
            </Button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold text-destructive">{t('settings.dangerZone')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.deleteAccountDesc')}
          </p>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => setShowDeleteDialog(true)}
          >
            {t('settings.deleteAccount')}
          </Button>

          <div className="mt-8 pt-6 border-t border-border/50">
            <Button
              onClick={() => signOut()}
              variant="destructive"
              className="w-full sm:w-auto rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('settings.signOut')}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 border border-destructive/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-destructive">
              <AlertTriangle className="h-5 w-5" /> {t('settings.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {t('settings.deleteConfirmDesc')}{' '}
              Type <span className="font-black text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder={t('settings.typeDelete')}
            className="rounded-xl border-destructive/30 mt-2"
          />
          <DialogFooter className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">{t('settings.cancel')}</Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('settings.confirmDeletion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings_Page;
