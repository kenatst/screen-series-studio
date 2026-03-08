import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api, ApiInspirationResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Inspiration = () => {
    const [data, setData] = useState<ApiInspirationResponse | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getInspiration()
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load inspiration", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data || data.categories.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                        <span className="text-3xl">🎨</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Inspiration Gallery Empty</h2>
                    <p className="text-muted-foreground max-w-md">
                        No curated App Store screenshots found in <code>server/inspiration/</code>.
                        Add some folders and images there to populate this gallery.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    const filteredImages = selectedCategory === 'All'
        ? data.images
        : data.images.filter(img => img.category === selectedCategory);

    return (
        <DashboardLayout>
            <div className="p-8 pb-20">
                <div className="mb-8 max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Find Inspiration</h1>
                    <p className="text-muted-foreground text-lg">
                        Browse curated, high-converting App Store screenshots.
                        Use these as visual references when generating your own project sets.
                    </p>
                </div>

                {/* Categories / Filters */}
                <div className="flex gap-2 flex-wrap mb-8">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'All'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                    >
                        All Categories
                    </button>
                    {data.categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Masonry-like Grid */}
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    <AnimatePresence>
                        {filteredImages.map(img => (
                            <motion.div
                                key={img.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="relative group rounded-2xl overflow-hidden border border-border bg-zinc-900/40 break-inside-avoid shadow-elevated hover:shadow-glow transition-all duration-500 cursor-pointer"
                            >
                                <img
                                    src={img.url}
                                    alt={img.filename}
                                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5">
                                    <div className="flex justify-between items-start">
                                        <Badge className="bg-white/10 backdrop-blur-md text-foreground border-border uppercase tracking-widest text-[10px] font-bold">
                                            {img.categoryName}
                                        </Badge>
                                    </div>

                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <Button
                                            variant="default"
                                            className="w-full bg-primary text-black hover:bg-primary/90 shadow-glow font-bold tracking-tight"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" /> Use as Reference
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Inspiration;
