import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useBilling() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async (targetPlan: string, redirectPath?: string) => {
        setIsUpgrading(true);
        try {
            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: {
                    plan: targetPlan,
                    redirect_path: redirectPath
                },
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
        } catch (e: unknown) {
            toast({ title: t("common.error"), description: e instanceof Error ? e.message : t("common.unknownError"), variant: "destructive" });
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsOpeningPortal(true);
        try {
            const { data, error } = await supabase.functions.invoke("customer-portal");
            if (error) throw error;
            if (data?.url) window.open(data.url, "_blank");
        } catch (e: unknown) {
            toast({ title: t("common.error"), description: e instanceof Error ? e.message : t("common.unknownError"), variant: "destructive" });
        } finally {
            setIsOpeningPortal(false);
        }
    };

    return {
        handleUpgrade,
        handleManageSubscription,
        isOpeningPortal,
        isUpgrading
    };
}
