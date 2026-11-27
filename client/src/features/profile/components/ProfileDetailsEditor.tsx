import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GENDER_OPTIONS, MIN_AGE, MAX_AGE } from "@shared/profile";
import type { PublicProfile } from "../../../types";
import { dateOfBirthError } from "../../../utils/date";
import { countryName, countryOptions, genderLabel } from "../../../i18n/catalogs";
import { getLocale } from "../../../i18n/formatters";
import CityCombobox from "../../../components/ui/CityCombobox";
import DateOfBirthInput from "../../../components/ui/DateOfBirthInput";
import Select from "../../../components/ui/Select";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import InlineEditButton from "./inline/InlineEditButton";

const fieldClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70";

const labelClass =
    "mb-1 block text-[11px] font-medium text-slate-600 dark:text-noir-text-muted";

interface ProfileDetailsEditorProps {
    profile: PublicProfile;
    isSelf: boolean;
    editor: ProfileSectionEditor;
}

function DetailsForm({
    profile,
    editor,
}: {
    profile: PublicProfile;
    editor: ProfileSectionEditor;
}) {
    const { t, i18n } = useTranslation("profile");
    const sortedCountries = useMemo(
        () =>
            countryOptions()
                .slice()
                .sort((a, b) =>
                    a.name.localeCompare(b.name, getLocale(i18n.language)),
                ),
        [i18n.language],
    );
    const [gender, setGender] = useState(profile.gender ?? "");
    const [birthdate, setBirthdate] = useState(
        (profile.birthdate ?? "").slice(0, 10),
    );
    const [country, setCountry] = useState(profile.country ?? "");
    const [city, setCity] = useState(profile.city ?? "");
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (birthdate) {
            const error = dateOfBirthError(birthdate, {
                minAge: MIN_AGE,
                maxAge: MAX_AGE,
            });
            if (error) {
                setLocalError(error);
                return;
            }
        }

        setLocalError(null);
        await editor.save({
            gender: gender || undefined,
            birthdate: birthdate || null,
            country: country || null,
            city: city.trim() || null,
        });
    };

    return (
        <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-noir-border dark:bg-noir-surface-alt/40"
        >
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="details-gender" className={labelClass}>
                        {t("details.gender")}
                    </label>
                    <Select
                        id="details-gender"
                        ariaLabel={t("details.gender")}
                        value={gender}
                        onChange={setGender}
                        disabled={editor.saving}
                        placeholder={t("details.unspecified")}
                        options={[
                            {
                                value: "",
                                label: t("details.unspecified"),
                            },
                            ...GENDER_OPTIONS.map((option) => ({
                                value: option.id,
                                label: genderLabel(option.id),
                            })),
                        ]}
                    />
                </div>
                <div>
                    <label
                        htmlFor="details-birthdate-day"
                        className={labelClass}
                    >
                        {t("details.birthdate")}
                    </label>
                    <DateOfBirthInput
                        id="details-birthdate"
                        value={birthdate}
                        onChange={(value) => {
                            setBirthdate(value);
                            setLocalError(null);
                        }}
                        disabled={editor.saving}
                        error={localError}
                        className={fieldClass}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="details-country" className={labelClass}>
                    {t("details.country")}
                </label>
                <Select
                    id="details-country"
                    ariaLabel={t("details.country")}
                    value={country}
                    onChange={setCountry}
                    disabled={editor.saving}
                    placeholder={t("details.unspecified")}
                    options={[
                        { value: "", label: t("details.unspecified") },
                        ...sortedCountries.map((option) => ({
                            value: option.code,
                            label: option.name,
                        })),
                    ]}
                />
            </div>

            <div>
                <label htmlFor="details-city" className={labelClass}>
                    {t("details.city")}
                </label>
                <CityCombobox
                    id="details-city"
                    value={city}
                    onChange={setCity}
                    country={country || undefined}
                    maxLength={80}
                    placeholder={t("details.cityPlaceholder")}
                    className={fieldClass}
                    disabled={editor.saving}
                />
            </div>

            {editor.error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400"
                >
                    {editor.error}
                </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                    type="button"
                    onClick={editor.cancel}
                    disabled={editor.saving}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                >
                    {t("details.cancel")}
                </button>
                <button
                    type="submit"
                    disabled={editor.saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {editor.saving && (
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {t("details.save")}
                </button>
            </div>
        </form>
    );
}

export default function ProfileDetailsEditor({
    profile,
    isSelf,
    editor,
}: ProfileDetailsEditorProps) {
    const { t } = useTranslation("profile");
    const editing = editor.isEditing("details");
    const country = profile.country
        ? countryName(profile.country, profile.country)
        : "";
    const location = [profile.city, country].filter(Boolean).join(", ");
    const gender = profile.gender ? genderLabel(profile.gender) : undefined;

    if (editing) {
        return <DetailsForm profile={profile} editor={editor} />;
    }

    if (!location && !gender && !isSelf) return null;

    return (
        <div className="space-y-1">
            {location && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-noir-text-muted">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {location}
                </p>
            )}

            {gender && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-noir-text-muted">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-noir-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                    {gender}
                </p>
            )}

            {isSelf && (
                <InlineEditButton
                    label={t("details.editLabel")}
                    onClick={() => editor.start("details")}
                />
            )}
        </div>
    );
}
