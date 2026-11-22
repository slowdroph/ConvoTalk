import { useTranslation } from "react-i18next";
import LegalLayout from "../components/LegalLayout";
import SEO from "../components/SEO";
import { getLocale } from "../i18n/formatters";

interface SectionProps {
    icon: string;
    title: string;
    children: React.ReactNode;
    highlighted?: boolean;
}

function Section({ icon, title, children, highlighted }: SectionProps) {
    return (
        <section>
            <h2 className="text-xl leading-7 font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span
                    className="material-symbols-outlined text-primary"
                    aria-hidden="true"
                >
                    {icon}
                </span>
                {title}
            </h2>
            {highlighted ? (
                <div className="bg-surface-container rounded-lg p-6 border border-outline-variant">
                    <div className="text-base text-on-surface-variant leading-relaxed">
                        {children}
                    </div>
                </div>
            ) : (
                <div className="text-base text-on-surface-variant leading-relaxed">
                    {children}
                </div>
            )}
        </section>
    );
}

function DataCard({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="bg-surface-container-low p-5 rounded border border-outline-variant">
            <h3 className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface mb-2">
                {title}
            </h3>
            <ul className="text-sm leading-5 text-on-surface-variant space-y-1 list-disc list-inside">
                {items.map((item, i) => (
                    <li key={i}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

export default function PrivacyPage() {
    const { t } = useTranslation("legal");
    const lastUpdated = new Date().toLocaleDateString(getLocale(), {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const storedItems = t("privacy.storedItems", {
        returnObjects: true,
    }) as string[];
    const notStoredItems = t("privacy.notStoredItems", {
        returnObjects: true,
    }) as string[];
    const purposes = t("privacy.s3Items", {
        returnObjects: true,
    }) as string[];
    const legalBases = t("privacy.s4Items", {
        returnObjects: true,
    }) as string[];
    const providers = t("privacy.s5Items", {
        returnObjects: true,
    }) as string[];
    const rights = t("privacy.s8Items", {
        returnObjects: true,
    }) as string[];

    return (
        <LegalLayout title={t("privacy.title")} lastUpdated={lastUpdated}>
            <SEO
                title={t("privacy.seoTitle")}
                description={t("privacy.seoDescription")}
                canonical="/privacy"
            />
            <div className="space-y-12">
                <p className="rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                    {t("notice")}
                </p>

                <Section icon="lock" title={t("privacy.s1Title")} highlighted>
                    <p>{t("privacy.s1Text")}</p>
                </Section>

                <Section icon="database" title={t("privacy.s2Title")}>
                    <p className="mb-4">{t("privacy.s2Intro")}</p>
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <DataCard
                            title={t("privacy.storedTitle")}
                            items={storedItems}
                        />
                        <DataCard
                            title={t("privacy.notStoredTitle")}
                            items={notStoredItems}
                        />
                    </div>
                </Section>

                <Section icon="target" title={t("privacy.s3Title")}>
                    <p>{t("privacy.s3Intro")}</p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        {purposes.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </Section>

                <Section icon="balance" title={t("privacy.s4Title")}>
                    <p>{t("privacy.s4Intro")}</p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        {legalBases.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </Section>

                <Section icon="share" title={t("privacy.s5Title")}>
                    <p>{t("privacy.s5Text1")}</p>
                    <ul className="mt-4 space-y-2 list-disc list-inside">
                        {providers.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                    <p className="mt-4">{t("privacy.s5Text2")}</p>
                </Section>

                <Section icon="cookie" title={t("privacy.s6Title")}>
                    <p>{t("privacy.s6Text1")}</p>
                    <p className="mt-4">{t("privacy.s6Text2")}</p>
                </Section>

                <Section icon="schedule" title={t("privacy.s7Title")}>
                    <p>{t("privacy.s7Text1")}</p>
                    <p className="mt-4">{t("privacy.s7Text2")}</p>
                </Section>

                <Section icon="check_circle" title={t("privacy.s8Title")}>
                    <p className="mb-4">{t("privacy.s8Intro")}</p>
                    <ul className="list-none space-y-3 text-base leading-6 text-on-surface-variant ml-2 border-l-2 border-surface-container-high pl-4">
                        {rights.map((right) => (
                            <li key={right} className="flex items-start gap-2">
                                <span
                                    className="material-symbols-outlined text-primary text-sm mt-1"
                                    aria-hidden="true"
                                >
                                    check_circle
                                </span>
                                {right}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4">{t("privacy.s8Text")}</p>
                </Section>

                <Section
                    icon="shield"
                    title={t("privacy.s9Title")}
                    highlighted
                >
                    <p>{t("privacy.s9Text")}</p>
                </Section>

                <Section icon="person_off" title={t("privacy.s10Title")}>
                    <p>{t("privacy.s10Text")}</p>
                </Section>

                <Section icon="support_agent" title={t("privacy.s11Title")}>
                    <p>{t("privacy.s11Text")}</p>
                </Section>

                <Section icon="update" title={t("privacy.s12Title")}>
                    <p>{t("privacy.s12Text")}</p>
                </Section>

                <Section icon="mail" title={t("privacy.s13Title")}>
                    <p>{t("privacy.s13Text1")}</p>
                    <p className="mt-4">{t("privacy.s13Text2")}</p>
                </Section>
            </div>
        </LegalLayout>
    );
}
