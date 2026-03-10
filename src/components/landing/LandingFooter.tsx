import appLogo from '@/assets/logo-screenforge.png';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const LandingFooter = () => {
    return (
        <footer className="border-t border-border bg-background relative overflow-hidden pt-24 pb-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[200px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
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
                    <div className="flex items-center gap-3">
                        <img src={screenforgeLogo} alt="ShotApp AI" className="h-7 w-7 rounded-lg object-cover" />
                        <span className="text-sm font-medium text-muted-foreground">© {new Date().getFullYear()} ShotApp AI. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-foreground/40">
                        <span className="hover:text-foreground transition-colors cursor-default">Privacy Policy</span>
                        <span className="hover:text-foreground transition-colors cursor-default">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
