import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";

import { WorkflowScrollytelling } from "@/components/landing/WorkflowScrollytelling";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { ConsistencyEngine } from "@/components/landing/ConsistencyEngine";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { BatchGenerationGrid } from "@/components/landing/BatchGenerationGrid";
import { Gallery } from "@/components/landing/Gallery";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <LandingNav />
      <main>
        <HeroSection />
        <div className="h-24 bg-background w-full"></div>
        <WorkflowScrollytelling />
        <ConsistencyEngine />
        <FeatureShowcase />
        <BatchGenerationGrid />
        <Gallery />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
