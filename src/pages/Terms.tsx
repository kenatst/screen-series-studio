import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-6">Last updated: March 2026</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing and using ShotApp AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on ShotApp AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on ShotApp AI</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Disclaimer</h2>
          <p>
            The materials on ShotApp AI are provided "as is". ShotApp AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitations of Liability</h2>
          <p>
            In no event shall ShotApp AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ShotApp AI, even if we or a ShotApp AI authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on ShotApp AI could include technical, typographical, or photographic errors. ShotApp AI does not warrant that any of the materials on the website are accurate, complete, or current. ShotApp AI may make changes to the materials contained on the website at any time without notice.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Links</h2>
          <p>
            ShotApp AI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ShotApp AI of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Modifications</h2>
          <p>
            ShotApp AI may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which ShotApp AI operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. User Content</h2>
          <p>
            You retain all rights to any content you submit, post, or display on ShotApp AI. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any media or distribution method.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">11. Payment Terms</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Subscription charges recur on the billing cycle you select</li>
            <li>You may cancel your subscription at any time</li>
            <li>Refunds are subject to our refund policy</li>
            <li>Prices are subject to change with 30 days' notice</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Information</h2>
          <p>
            For any questions regarding these Terms of Service, please contact us at:
          </p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> support@shotapp.ai</p>
            <p><strong>Address:</strong> ShotApp AI Inc.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();
  const sectionKeys = [
    "scope",
    "eligibility",
    "account",
    "license",
    "aiContent",
    "billing",
    "refunds",
    "use",
    "suspension",
    "disclaimers",
    "liability",
    "law",
    "contact",
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary font-semibold hover:underline">
            {t("termsPage.backHome")}
          </Link>
          <h1 className="text-4xl font-black mt-3">{t("termsPage.title")}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t("termsPage.lastUpdated", { date: "March 17, 2026" })}</p>
        </div>
        <p className="text-sm leading-7 text-muted-foreground mb-8">{t("termsPage.intro")}</p>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          {sectionKeys.map((sectionKey) => (
            <section key={sectionKey}>
              <h2 className="text-xl font-bold text-foreground mb-2">{t(`termsPage.sections.${sectionKey}.title`)}</h2>
              <p>
                {t(`termsPage.sections.${sectionKey}.body`)}
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

export default Terms;
