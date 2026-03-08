import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { WorkflowScrollytelling } from "@/components/landing/WorkflowScrollytelling";
import { ConsistencyEngine } from "@/components/landing/ConsistencyEngine";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { BatchGenerationGrid } from "@/components/landing/BatchGenerationGrid";
import { Gallery } from "@/components/landing/Gallery";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <LandingNav />
      <main>
        <HeroSection />
        <SocialProof />
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
