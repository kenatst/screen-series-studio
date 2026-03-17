import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary font-semibold hover:underline">
            Back to home
          </Link>
          <h1 className="text-4xl font-black mt-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: March 17, 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">1. Data we collect</h2>
            <p>
              We collect account details, project metadata, uploaded assets, generated outputs, billing events, and
              technical logs required to operate ShotApp AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">2. How we use data</h2>
            <p>
              We use your data to provide screenshot generation, account security, payment processing, fraud prevention,
              and support. We do not sell personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">3. Data retention</h2>
            <p>
              We retain data while your account is active, or as required for legal and financial compliance.
              You can request deletion from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">4. Third-party processors</h2>
            <p>
              We rely on infrastructure and payment partners such as Supabase and Stripe. These processors handle data
              according to their own security and privacy terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">5. Contact</h2>
            <p>
              Privacy requests can be sent to{" "}
              <a className="text-primary hover:underline" href="mailto:support@shotapp.ai">
                support@shotapp.ai
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
