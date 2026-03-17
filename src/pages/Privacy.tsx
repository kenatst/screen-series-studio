import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-6">Last updated: March 2026</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p>
            ShotApp AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-bold mt-6 mb-3">Personal Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Email address and authentication credentials</li>
            <li>Profile information (name, app details)</li>
            <li>Payment information (processed securely via Stripe)</li>
            <li>Usage data and project history</li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Device information and browser type</li>
            <li>IP address and access logs</li>
            <li>Pages viewed and time spent</li>
            <li>Referral sources</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide and improve our services</li>
            <li>Process payments and manage billing</li>
            <li>Send transactional and service emails</li>
            <li>Personalize your experience</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your data. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Third-Party Services</h2>
          <p>
            We use third-party services including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Supabase</strong> - Database and authentication</li>
            <li><strong>Stripe</strong> - Payment processing</li>
            <li><strong>Google Gemini</strong> - AI image generation</li>
            <li><strong>Vercel</strong> - Hosting and deployment</li>
          </ul>
          <p>
            These providers have their own privacy policies. We encourage you to review them.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Rights</h2>
          <p>Depending on your location, you may have rights including:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access to your personal data</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise these rights, contact us at privacy@shotapp.ai
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser preferences.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact Us</h2>
          <p>
            For privacy-related questions, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> privacy@shotapp.ai</p>
            <p><strong>Address:</strong> ShotApp AI Inc.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();
  const sectionKeys = [
    "data",
    "usage",
    "legalBasis",
    "retention",
    "security",
    "processors",
    "transfers",
    "rights",
    "children",
    "changes",
    "contact",
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary font-semibold hover:underline">
            {t("privacyPage.backHome")}
          </Link>
          <h1 className="text-4xl font-black mt-3">{t("privacyPage.title")}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t("privacyPage.lastUpdated", { date: "March 17, 2026" })}</p>
        </div>
        <p className="text-sm leading-7 text-muted-foreground mb-8">{t("privacyPage.intro")}</p>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          {sectionKeys.map((sectionKey) => (
            <section key={sectionKey}>
              <h2 className="text-xl font-bold text-foreground mb-2">{t(`privacyPage.sections.${sectionKey}.title`)}</h2>
              <p>
                {t(`privacyPage.sections.${sectionKey}.body`)}
                {sectionKey === "contact" ? (
                  <>
                    {" "}
                    <a className="text-primary hover:underline" href="mailto:support@shotapp.ai">
                      support@shotapp.ai
                    </a>
                  </>
                ) : null}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Privacy;
