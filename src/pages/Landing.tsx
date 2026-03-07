import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers, Zap, Palette, Globe, ArrowRight, Sparkles, CheckCircle2,
  Monitor, Smartphone, LayoutGrid, Lock, RefreshCw, BarChart3, ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">ScreenForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Log in</Button>
            <Button variant="hero" size="sm" onClick={() => navigate('/dashboard')}>
              Start free <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="mr-1 h-3 w-3" /> Now in public beta
            </Badge>
          </motion.div>

          <motion.h1
            className="mx-auto max-w-4xl text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Generate App Store screenshot sets that look{" "}
            <span className="text-gradient-primary">premium</span> &{" "}
            <span className="text-gradient-accent">consistent</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Create up to 10 cohesive, store-ready screenshots in minutes. Define the story. We generate the full visual system.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button variant="hero" size="lg" className="text-base px-8 h-12" onClick={() => navigate('/dashboard')}>
              Start generating for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 h-12">
              Watch demo
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> 5 free sets</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> iOS & Android</span>
          </motion.div>

          {/* Preview mockup */}
          <motion.div
            className="mx-auto mt-16 max-w-5xl"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative rounded-xl border border-border/50 bg-card p-2 shadow-elevated">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground font-mono">screenforge.app — Screenshot Set Planner</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3 p-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="group relative aspect-[9/19.5] rounded-lg bg-secondary border border-border/50 overflow-hidden hover:border-primary/30 transition-all">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                      <div className="h-6 w-6 rounded-full bg-primary/20 mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{i}</span>
                      </div>
                      <div className="h-2 w-3/4 rounded bg-muted-foreground/20 mb-1" />
                      <div className="h-2 w-1/2 rounded bg-muted-foreground/10" />
                      <div className="mt-3 h-16 w-full rounded bg-secondary" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="h-1.5 rounded bg-primary/30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary text-muted-foreground border-border">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Everything you need for store-ready screenshots
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From batch generation to consistency engine — built for teams who ship apps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: 'Series-First Generation', desc: 'Generate 3–10 cohesive screenshots as a set, not isolated images. Every visual shares the same creative direction.', color: 'text-primary' },
              { icon: Zap, title: 'Fast Batch Generation', desc: 'Generate up to 10 screenshots in a single workflow. No more one-by-one manual creation.', color: 'text-accent' },
              { icon: Lock, title: 'Consistency Engine', desc: 'Shared palette, typography, framing, and visual language across every slide in your set.', color: 'text-success' },
              { icon: Palette, title: 'Brand Kit Integration', desc: 'Upload your logo, colors, fonts, and mascot. Every generated screenshot respects your brand.', color: 'text-info' },
              { icon: RefreshCw, title: 'Per-Slide Regeneration', desc: 'Edit and regenerate individual slides without breaking the visual coherence of the full set.', color: 'text-warning' },
              { icon: Globe, title: 'Localization & A/B Testing', desc: 'Duplicate sets for new locales. Create A/B variants. Compare side by side.', color: 'text-primary' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-xl border border-border/50 bg-card p-6 hover:border-primary/20 hover:shadow-glow transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-24 bg-surface-elevated">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary text-muted-foreground border-border">Workflow</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              From app info to store-ready in 6 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Project', desc: 'Set your app name, platform, goals, and target audience.', icon: Monitor },
              { step: '02', title: 'Add App Info', desc: 'Describe your app, features, benefits, and tone of voice.', icon: BarChart3 },
              { step: '03', title: 'Upload Screens', desc: 'Drag & drop raw screenshots, tag and organize them.', icon: Smartphone },
              { step: '04', title: 'Set Brand Kit', desc: 'Upload logo, colors, typography, and visual preferences.', icon: Palette },
              { step: '05', title: 'Plan Your Set', desc: 'Define each slide\'s headline, objective, and visual emphasis.', icon: LayoutGrid },
              { step: '06', title: 'Generate & Export', desc: 'Batch generate all slides with guaranteed consistency.', icon: Sparkles },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="relative flex gap-4 p-6 rounded-xl border border-border/50 bg-card"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-lg">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section id="templates" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary text-muted-foreground border-border">Templates</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Premium templates for every category
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose from 10+ professionally designed styles or upload your own references.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Clean SaaS', 'Bold Gaming', 'Premium Gradient', 'Educational Playful', 'Cinematic',
              'Luxury Minimal', 'Feature-Led', 'Mascot-Led', 'Lifestyle', 'Comparison'].map((name, i) => (
              <motion.div
                key={name}
                className="group aspect-[3/4] rounded-xl border border-border/50 bg-card flex flex-col items-center justify-center p-4 hover:border-primary/30 hover:shadow-glow transition-all cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
              >
                <div className="h-20 w-16 rounded-lg bg-secondary mb-3 flex items-center justify-center">
                  <LayoutGrid className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-surface-elevated">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary text-muted-foreground border-border">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Simple, transparent pricing
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Starter', price: 'Free', desc: '5 screenshot sets', features: ['3 slides per set', 'Basic templates', 'PNG export', 'Watermarked'] },
              { name: 'Pro', price: '$29/mo', desc: 'Unlimited sets', features: ['10 slides per set', 'All templates', 'PNG/JPG/ZIP export', 'Brand kit', 'No watermark', 'A/B testing'], popular: true },
              { name: 'Agency', price: '$99/mo', desc: 'Teams & clients', features: ['Everything in Pro', 'Localization', 'Priority generation', 'Custom templates', 'Team collaboration', 'API access'] },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-xl border p-8 ${plan.popular ? 'border-primary/50 bg-card shadow-glow' : 'border-border/50 bg-card'}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Most popular</Badge>}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <Button variant={plan.popular ? 'hero' : 'secondary'} className="w-full mb-6">
                  Get started <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Ready to forge your screenshots?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            You define the story. We generate the full visual system.
          </p>
          <Button variant="hero" size="lg" className="text-base px-10 h-12" onClick={() => navigate('/dashboard')}>
            Start generating now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">ScreenForge</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 ScreenForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
