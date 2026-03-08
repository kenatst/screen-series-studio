import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useBilling() {
    const { toast } = useToast();
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async (targetPlan: string) => {
        setIsUpgrading(true);
        try {
            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: { plan: targetPlan },
            });
            if (error) throw error;
            if (data?.url) window.open(data.url, "_blank");
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
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
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
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
