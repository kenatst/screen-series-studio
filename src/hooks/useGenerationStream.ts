import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { TFunction } from "i18next";
import { flushSseBuffer, parseSseChunk } from "@/lib/sse";

export type SlideUiStatus = "pending" | "generating" | "completed" | "error";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface UseGenerationStreamParams {
  projectId?: string;
  t: TFunction;
  toast: (options: ToastOptions) => void;
  stopPolling: () => void;
  refreshProfile: () => Promise<void>;
  requestAbortRef: MutableRefObject<AbortController | null>;
  setCurrentPhase: Dispatch<SetStateAction<number>>;
  setActiveSlideNumber: Dispatch<SetStateAction<number | null>>;
  setReviewMode: Dispatch<SetStateAction<boolean>>;
  setSlideStatuses: Dispatch<SetStateAction<SlideUiStatus[]>>;
  setSlideImages: Dispatch<SetStateAction<(string | null)[]>>;
  setReviewSlideNumber: Dispatch<SetStateAction<number | null>>;
  setHasMoreSlides: Dispatch<SetStateAction<boolean>>;
  setProgress: Dispatch<SetStateAction<number>>;
}

export function useGenerationStream({
  projectId,
  t,
  toast,
  stopPolling,
  refreshProfile,
  requestAbortRef,
  setCurrentPhase,
  setActiveSlideNumber,
  setReviewMode,
  setSlideStatuses,
  setSlideImages,
  setReviewSlideNumber,
  setHasMoreSlides,
  setProgress,
}: UseGenerationStreamParams) {
  const [isDispatching, setIsDispatching] = useState(false);

  const startGenerationStream = useCallback(async (
    accessToken: string,
    resume = false,
    targetSlide?: number,
    userFeedback?: string,
  ): Promise<"done" | "hasMore" | "busy" | { error: string }> => {
    setIsDispatching(true);
    try {
      if (!projectId) return { error: t("generating.errors.noProjectId") };
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (requestAbortRef.current) requestAbortRef.current.abort();
      requestAbortRef.current = new AbortController();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          project_id: projectId,
          resume,
          target_slide_number: targetSlide,
          user_feedback: userFeedback,
          idempotency_key: crypto.randomUUID(),
        }),
        signal: requestAbortRef.current.signal,
      });

      if (response.status === 409) {
        setIsDispatching(false);
        return "busy";
      }
      if (response.status === 402) {
        setIsDispatching(false);
        return { error: t("generating.errors.insufficientCredits") };
      }
      if (response.status === 401 || response.status === 403) {
        setIsDispatching(false);
        return { error: t("generating.errors.authIssue") };
      }
      if (!response.ok || !response.body) {
        try {
          const errData = await response.json();
          setIsDispatching(false);
          return { error: errData.error || t("generating.errors.server", { status: response.status }) };
        } catch {
          setIsDispatching(false);
          return { error: t("generating.errors.server", { status: response.status }) };
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let localHasMore = false;
      let hasReceivedEvent = false;

      const handleEvent = (eventType: string, eventDataRaw: string) => {
        if (!eventType || !eventDataRaw) return;
        if (!hasReceivedEvent) {
          hasReceivedEvent = true;
          setIsDispatching(false);
        }

        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(eventDataRaw) as Record<string, unknown>;
        } catch {
          return;
        }

        if (eventType === "slide-start") {
          const slideNumber = Number(data.slideNumber || 1);
          const index = Math.max(0, slideNumber - 1);
          setCurrentPhase(4);
          setActiveSlideNumber(slideNumber);
          setReviewMode(false);
          setSlideStatuses((prev) => {
            const length = Math.max(prev.length, index + 1, Number(data.total || 0));
            const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
            next[index] = "generating";
            return next;
          });
        }

        if (eventType === "slide-done") {
          const slideNumber = Number(data.slideNumber || 1);
          const index = Math.max(0, slideNumber - 1);
          setActiveSlideNumber(slideNumber);
          setReviewSlideNumber(slideNumber);
          setSlideStatuses((prev) => {
            const length = Math.max(prev.length, index + 1);
            const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
            next[index] = "completed";
            return next;
          });
          setSlideImages((prev) => {
            const length = Math.max(prev.length, index + 1);
            const next = Array.from({ length }, (_, i) => prev[i] ?? null);
            next[index] = (data.imageUrl as string) || next[index];
            return next;
          });
          void refreshProfile();
        }

        if (eventType === "slide-error") {
          const index = Math.max(0, Number((data.slideNumber as number) || 1) - 1);
          setSlideStatuses((prev) => {
            const length = Math.max(prev.length, index + 1);
            const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
            next[index] = "error";
            return next;
          });
        }

        if (eventType === "all-done") {
          localHasMore = Boolean(data.hasMore);
          setHasMoreSlides(localHasMore);
          setReviewMode(true);
          if (!localHasMore) {
            setCurrentPhase(6);
            setProgress(100);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(textBuffer, chunkText);
        textBuffer = parsed.buffer;
        parsed.events.forEach((event) => handleEvent(event.event, event.data));
      }

      flushSseBuffer(textBuffer).forEach((event) => handleEvent(event.event, event.data));

      setIsDispatching(false);
      return localHasMore ? "hasMore" : "done";
    } catch (error: unknown) {
      setIsDispatching(false);
      if (error instanceof Error && error.name === "AbortError") return "busy";
      const reason = error instanceof Error ? error.message : t("generating.errors.networkFallback");
      return { error: t("generating.errors.requestFailed", { reason }) };
    }
  }, [
    projectId,
    refreshProfile,
    requestAbortRef,
    setActiveSlideNumber,
    setCurrentPhase,
    setHasMoreSlides,
    setProgress,
    setReviewMode,
    setReviewSlideNumber,
    setSlideImages,
    setSlideStatuses,
    t,
  ]);

  const processQueue = useCallback(async (
    accessToken: string,
    initialResume: boolean,
    targetSlide?: number,
    userFeedback?: string,
  ) => {
    const result = await startGenerationStream(accessToken, initialResume, targetSlide, userFeedback);
    if (result === "busy") return;

    if (typeof result === "object" && result.error) {
      toast({
        title: t("generating.generationFailed"),
        description: result.error,
        variant: "destructive",
        duration: 8000,
      });
      stopPolling();
      return;
    }

    if (result === "done") {
      stopPolling();
    }
  }, [startGenerationStream, stopPolling, t, toast]);

  return {
    isDispatching,
    processQueue,
  };
}
