import { useTranslation } from "react-i18next";
import LegalLayout from "../components/LegalLayout";
import SEO from "../components/SEO";
import Icon from "../components/ui/Icon";
import { formatLegalLastUpdated } from "../i18n/legalDate";

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
                <Icon name={icon} className="text-primary" />
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

function ProhibitedList({ items }: { items: string[] }) {
    return (
        <ul className="list-none space-y-3 text-base leading-6 text-on-surface-variant ml-2 border-l-2 border-surface-container-high pl-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <Icon name="close" className="text-error text-sm mt-1" />
                    {item}
                </li>
            ))}
        </ul>
    );
}

export default function TermsPage() {
    const { t } = useTranslation("legal");
    const lastUpdated = formatLegalLastUpdated();
    const prohibited = t("terms.s2Items", {
        returnObjects: true,
    }) as string[];

    return (
        <LegalLayout title={t("terms.title")} lastUpdated={lastUpdated}>
            <SEO
                title={t("terms.seoTitle")}
                description={t("terms.seoDescription")}
                canonical="/terms"
            />
            <div className="space-y-12">
                <p className="rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                    {t("notice")}
                </p>

                <Section
                    icon="lock"
                    title={t("terms.s1Title")}
                    highlighted
                >
                    <p>
                        {t("terms.s1Before")}{" "}
                        <a
                            href="/privacy"
                            className="text-primary hover:text-on-surface transition-colors"
                        >
                            {t("terms.s1Link")}
                        </a>
                        {t("terms.s1After")}
                    </p>
                </Section>

                <Section icon="gavel" title={t("terms.s2Title")}>
                    <p className="mb-4">{t("terms.s2Intro")}</p>
                    <ProhibitedList items={prohibited} />
                </Section>

                <Section icon="description" title={t("terms.s3Title")}>
                    <p>{t("terms.s3Text1")}</p>
                    <p className="mt-4">{t("terms.s3Text2")}</p>
                </Section>

                <Section icon="copyright" title={t("terms.s4Title")}>
                    <p>{t("terms.s4Text")}</p>
                </Section>

                <Section icon="info" title={t("terms.s5Title")}>
                    <p>{t("terms.s5Text")}</p>
                </Section>

                <Section icon="balance" title={t("terms.s6Title")}>
                    <p>{t("terms.s6Text")}</p>
                </Section>

                <Section icon="update" title={t("terms.s7Title")}>
                    <p>{t("terms.s7Text")}</p>
                </Section>

                <Section icon="logout" title={t("terms.s8Title")}>
                    <p>{t("terms.s8Text")}</p>
                </Section>

                <Section icon="gavel" title={t("terms.s9Title")}>
                    <p>{t("terms.s9Text")}</p>
                </Section>

                <Section icon="mail" title={t("terms.s10Title")}>
                    <p>{t("terms.s10Text")}</p>
                </Section>
            </div>
        </LegalLayout>
    );
}
