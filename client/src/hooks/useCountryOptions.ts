import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getLocale } from "../i18n/formatters";
import { countryName } from "../i18n/catalogs";
import { COUNTRIES, type Country } from "../utils/countries";

export function useCountryOptions(): ReadonlyArray<Country> {
    const { i18n } = useTranslation();

    return useMemo(() => {
        const locale = getLocale();
        return [...COUNTRIES]
            .map((country) => ({
                ...country,
                name: countryName(country.code, country.name),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, locale));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.resolvedLanguage]);
}
