import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const LandingFooter = () => {
    return (
        <footer className="border-t border-border bg-background relative overflow-hidden pt-24 pb-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[200px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                <div className="h-16 w-16 mb-8 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-glow">
                    <Sparkles className="h-8 w-8 text-foreground" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 max-w-2xl">
                    Ready to generate your premium screenshot sets?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-xl">
                    Join leading founders and ASO teams saving hours of design time while increasing conversions.
                </p>
                <Link to="/project/new">
                    <Button className="bg-white text-black hover:bg-white/90 font-bold text-lg h-14 px-10 rounded-full shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                        Start free trial today
                    </Button>
                </Link>
                <p className="mt-4 text-sm text-foreground/40">No credit card required. 7-day free trial.</p>

                <div className="w-full h-px bg-black/5 my-16" />

                <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tracking-tight text-foreground">ScreenForge</span>
                        <span className="text-foreground/40 text-sm">© {new Date().getFullYear()} All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-foreground/40">
                        <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                        <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
