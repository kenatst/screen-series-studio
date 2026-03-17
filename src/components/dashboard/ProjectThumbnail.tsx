import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjectSlides } from "@/hooks/useProjects";
import { isStoragePath, resolveSignedUrl } from "@/lib/storage-utils";

/** Shows the app logo (from uploaded brand assets) or falls back to first slide thumbnail */
export const ProjectThumbnail = ({ projectId }: { projectId: string }) => {
    const { data: slides } = useProjectSlides(projectId);

    const { data: logoUrl } = useQuery({
        queryKey: ['project-logo', projectId],
        queryFn: async () => {
            // Try to find a logo asset for this project
            const { data: assets } = await supabase
                .from('assets')
                .select('storage_path')
                .eq('project_id', projectId)
                .eq('asset_type', 'logo')
                .limit(1);

            if (assets && assets.length > 0) {
                const { data } = await supabase.storage
                    .from('raw-uploads')
                    .createSignedUrl(assets[0].storage_path, 3600);
                if (data?.signedUrl) return data.signedUrl;
            }

            // Fallback: try icon
            const { data: iconAssets } = await supabase
                .from('assets')
                .select('storage_path')
                .eq('project_id', projectId)
                .eq('asset_type', 'icon')
                .limit(1);

            if (iconAssets && iconAssets.length > 0) {
                const { data } = await supabase.storage
                    .from('raw-uploads')
                    .createSignedUrl(iconAssets[0].storage_path, 3600);
                if (data?.signedUrl) return data.signedUrl;
            }
            return null;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes cache to prevent flickering
    });

    const firstSlide = slides?.[0];
    const { data: firstSlideUrl } = useQuery({
        queryKey: ["project-slide-thumb", projectId, firstSlide?.id, firstSlide?.image_url],
        enabled: !!firstSlide?.image_url,
        queryFn: async () => {
            if (!firstSlide?.image_url) return null;
            if (!isStoragePath(firstSlide.image_url)) return firstSlide.image_url;
            return resolveSignedUrl("generated-outputs", firstSlide.image_url);
        },
        staleTime: 1000 * 60 * 90,
    });

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt="App logo"
                className="w-full h-full object-contain p-1"
            />
        );
    }

    if (firstSlideUrl) {
        return (
            <img
                src={firstSlideUrl}
                alt="Project thumbnail"
                className="w-full h-full object-cover"
            />
        );
    }

    return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl filter drop-shadow-md">📱</span>
        </div>
    );
};
