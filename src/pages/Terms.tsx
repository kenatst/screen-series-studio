import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary font-semibold hover:underline">
            Back to home
          </Link>
          <h1 className="text-4xl font-black mt-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: March 17, 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">1. Service scope</h2>
            <p>
              ShotApp AI provides software tools to generate and export app-store screenshot creatives.
              Features and limits depend on your active plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">2. Account responsibility</h2>
            <p>
              You are responsible for account credentials, uploaded materials, and generated content usage.
              You must have rights to all assets you upload.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">3. Billing and credits</h2>
            <p>
              Paid plans are billed on a recurring monthly basis. Credits are consumed per action as shown in-product.
              Abuse, chargebacks, or fraud may lead to suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">4. Acceptable use</h2>
            <p>
              You may not use the service for unlawful, infringing, deceptive, or harmful content.
              We may suspend access for policy violations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">5. Contact</h2>
            <p>
              Terms questions can be sent to{" "}
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

export default Terms;
