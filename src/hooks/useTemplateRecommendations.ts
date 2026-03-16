import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TemplateMatch {
  template_name: string;
  visual_summary: string | null;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

interface RecommendationResult {
  matches: TemplateMatch[];
  copilot_summary: string;
}

export function useTemplateRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(
    async (params: {
      screenshotUrls?: string[];
      logoUrl?: string;
      inspirationText?: string;
      appName?: string;
      appDescription?: string;
      contextText?: string;
    }) => {
      // Need at least some input
      if (
        (!params.screenshotUrls || params.screenshotUrls.length === 0) &&
        !params.logoUrl &&
        !params.inspirationText &&
        !params.appDescription &&
        !params.contextText
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "generate-project-embedding",
          {
            body: {
              screenshot_urls: params.screenshotUrls || [],
              logo_url: params.logoUrl || null,
              user_inspiration_text: params.inspirationText || null,
              app_name: params.appName || null,
              app_description: params.appDescription || null,
              context_text: params.contextText || null,
            },
          }
        );

        if (fnError) throw fnError;

        setRecommendations({
          matches: data.matches || [],
          copilot_summary: data.copilot_summary || "",
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearRecommendations = useCallback(() => {
    setRecommendations(null);
    setError(null);
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
    clearRecommendations,
  };
}
