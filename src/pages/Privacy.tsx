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
