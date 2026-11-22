import { useTranslation } from "react-i18next";
import LanguageSelector from "../ui/LanguageSelector";

export default function LanguageSettings() {
    const { t } = useTranslation(["settings", "common"]);

    return (
        <div className="space-y-6">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    {t("settings:language.title")}
                </h2>
                <p className="mt-0.5 text-xs text-noir-text-muted">
                    {t("settings:language.description")}
                </p>
            </div>

            <div className="max-w-md space-y-2">
                <label
                    htmlFor="interface-language"
                    className="block text-xs font-semibold text-noir-text-bright"
                >
                    {t("common:language.label")}
                </label>
                <LanguageSelector id="interface-language" />
                <p className="text-[11px] leading-relaxed text-noir-text-muted">
                    {t("common:language.deviceHint")}
                </p>
            </div>
        </div>
    );
}
