import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getPlanById, PLANS } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Crown, CheckCircle2, Loader2, Settings, CreditCard, ExternalLink, RefreshCw, X
} from "lucide-react";

const Settings_Page = () => {
  const { profile, checkSubscription, user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const plan = getPlanById(profile?.plan || "free");

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Paiement réussi !", description: "Votre abonnement est actif. Rafraîchissement en cours..." });
      setTimeout(() => checkSubscription(), 2000);
    }
  }, [searchParams]);

  const handleUpgrade = async (targetPlan: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: targetPlan },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkSubscription();
    setIsRefreshing(false);
    toast({ title: "Statut mis à jour" });
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Settings & Billing</h1>
          <p className="text-muted-foreground font-medium mb-10">Manage your subscription and account.</p>
        </motion.div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border-2 border-primary/30 bg-card/80 backdrop-blur-sm p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black tracking-tight text-foreground">{plan.name}</h2>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold uppercase">
                  {plan.priceValue > 0 ? "Active" : "Free tier"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-foreground">{plan.price}</span>
              {plan.priceValue > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
          </div>

          {profile?.subscriptionEnd && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">Next billing date:</span>{" "}
                {new Date(profile.subscriptionEnd).toLocaleDateString("fr-FR", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {plan.features.map(f => (
              <div key={f} className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {profile?.plan !== "free" && (
              <Button onClick={handleManageSubscription} disabled={isOpeningPortal} variant="outline" className="rounded-xl">
                {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                Manage Subscription
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="ghost" className="rounded-xl">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Status
            </Button>
          </div>
        </motion.div>

        {/* Available Plans */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">Available Plans</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((p) => {
              const isCurrent = profile?.plan === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-5 flex flex-col border ${
                    isCurrent ? "border-primary/50 bg-primary/5" : p.popular ? "border-primary/30 bg-card" : "border-border bg-card/50"
                  }`}
                >
                  {p.popular && !isCurrent && (
                    <Badge className="mb-3 w-fit bg-primary/20 text-primary border-primary/30 text-[10px]">Popular</Badge>
                  )}
                  {isCurrent && (
                    <Badge className="mb-3 w-fit bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Current</Badge>
                  )}
                  <h3 className="font-bold text-foreground text-lg">{p.name}</h3>
                  <div className="mt-1 mb-4">
                    <span className="text-2xl font-black text-foreground">{p.price}</span>
                    {p.priceValue > 0 && <span className="text-muted-foreground text-xs">/mo</span>}
                  </div>
                  <div className="space-y-2 flex-1 mb-4">
                    {p.features.slice(0, 3).map(f => (
                      <div key={f} className="flex gap-2 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    disabled={isCurrent || p.id === "free"}
                    onClick={() => handleUpgrade(p.id)}
                    className={`rounded-xl text-xs font-bold ${
                      isCurrent ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isCurrent ? "Current" : p.id === "free" ? "Free" : p.cta}
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8 rounded-2xl border border-border bg-card/50 p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono text-muted-foreground">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Credits</span>
              <span className="text-sm font-bold text-foreground">{profile?.credits ?? 0}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings_Page;
