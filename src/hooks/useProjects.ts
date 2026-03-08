import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectSlide = Database["public"]["Tables"]["project_slides"]["Row"];
type ProjectSlideInsert = Database["public"]["Tables"]["project_slides"]["Insert"];

/**
 * Checks if a string looks like a storage path (not a full URL).
 * Storage paths look like: "userId/projectId/slide-1.png"
 * Signed URLs start with "https://"
 */
function isStoragePath(value: string | null): boolean {
  if (!value) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Project;
    },
  });
}

export function useProjectSlides(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-slides", projectId],
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 min cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_slides")
        .select("*")
        .eq("project_id", projectId!)
        .order("slide_number", { ascending: true });
      if (error) throw error;

      const slides = data as ProjectSlide[];

      // Resolve storage paths to signed URLs (2h expiry, cached by RQ)
      const slidesWithUrls = await Promise.all(
        slides.map(async (slide) => {
          if (slide.image_url && isStoragePath(slide.image_url)) {
            const { data: signedData } = await supabase.storage
              .from("generated-outputs")
              .createSignedUrl(slide.image_url, 60 * 60 * 2);
            return {
              ...slide,
              image_url: signedData?.signedUrl || slide.image_url,
            };
          }
          return slide;
        })
      );

      return slidesWithUrls as ProjectSlide[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: Omit<ProjectInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

export function useSaveSlides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, slides }: { projectId: string; slides: Omit<ProjectSlideInsert, "project_id">[] }) => {
      // Upsert slides using slide_number as the conflict key
      const { data, error } = await supabase
        .from("project_slides")
        .upsert(
          slides.map(s => ({ ...s, project_id: projectId })),
          { onConflict: "project_id,slide_number", ignoreDuplicates: false }
        )
        .select();

      if (error) {
        // Fallback: delete + insert if upsert fails (no unique constraint yet)
        await supabase.from("project_slides").delete().eq("project_id", projectId);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("project_slides")
          .insert(slides.map(s => ({ ...s, project_id: projectId })))
          .select();
        if (fallbackError) throw fallbackError;
        return fallbackData as ProjectSlide[];
      }

      // Delete slides with higher numbers that are no longer in the set
      const maxNumber = slides.length;
      await supabase
        .from("project_slides")
        .delete()
        .eq("project_id", projectId)
        .gt("slide_number", maxNumber);

      return data as ProjectSlide[];
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project-slides", vars.projectId] });
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}

export function useUnarchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "draft" })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}