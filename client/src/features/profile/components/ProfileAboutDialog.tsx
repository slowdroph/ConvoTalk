import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INTEREST_OPTIONS, MAX_INTERESTS } from "@shared/interests";
import {
    DEFAULT_LANGUAGE_LEVEL,
    GENDER_OPTIONS,
    LANGUAGE_LEVEL_OPTIONS,
    LANGUAGE_OPTIONS,
    MAX_LANGUAGES,
    MIN_AGE,
    calculateAge,
    getLanguageOption,
} from "@shared/profile";
import { COUNTRIES } from "../../../utils/countries";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import type { User } from "../../../types";
import CityCombobox from "../../../components/ui/CityCombobox";
import { updateAbout } from "../services/profileApi";

const MAX_BIO = 1000;

const sortedCountries = [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
);

const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70";

const maxBirthdate = (() => {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - MIN_AGE);
    return date.toISOString().slice(0, 10);
})();

interface ProfileAboutDialogProps {
    isOpen: boolean;
    bio: string;
    interests: string[];
    gender?: string;
    birthdate?: string;
    country?: string;
    city?: string;
    languages?: string[];
    languageLevels?: Record<string, string>;
    status?: string;
    onClose: () => void;
    onSaved: (user: User) => void;
}

export default function ProfileAboutDialog({
    isOpen,
    bio,
    interests,
    gender = "",
    birthdate = "",
    country = "",
    city = "",
    languages = [],
    languageLevels = {},
    status = "",
    onClose,
    onSaved,
}: ProfileAboutDialogProps) {
    const { showToast } = useToast();
    const [draftBio, setDraftBio] = useState(bio);
    const [draftInterests, setDraftInterests] = useState<string[]>(interests);
    const [draftGender, setDraftGender] = useState(gender);
    const [draftBirthdate, setDraftBirthdate] = useState(
        birthdate.slice(0, 10),
    );
    const [draftCountry, setDraftCountry] = useState(country);
    const [draftCity, setDraftCity] = useState(city);
    const [draftLanguages, setDraftLanguages] =
        useState<string[]>(languages);
    const [draftLanguageLevels, setDraftLanguageLevels] = useState<
        Record<string, string>
    >(languageLevels);
    const [draftStatus, setDraftStatus] = useState(status);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setDraftBio(bio);
            setDraftInterests(interests);
            setDraftGender(gender);
            setDraftBirthdate(birthdate.slice(0, 10));
            setDraftCountry(country);
            setDraftCity(city);
            setDraftLanguages(languages);
            setDraftLanguageLevels(languageLevels);
            setDraftStatus(status);
            setError(null);
            setSaving(false);
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const toggleInterest = (id: string) => {
        setError(null);

        if (draftInterests.includes(id)) {
            setDraftInterests((current) =>
                current.filter((interest) => interest !== id),
            );
            return;
        }

        if (draftInterests.length >= MAX_INTERESTS) {
            setError(`Escolha no máximo ${MAX_INTERESTS} interesses.`);
            return;
        }

        setDraftInterests((current) => [...current, id]);
    };

    const toggleLanguage = (id: string) => {
        setError(null);

        if (draftLanguages.includes(id)) {
            setDraftLanguages((current) =>
                current.filter((language) => language !== id),
            );
            setDraftLanguageLevels((current) => {
                const next = { ...current };
                delete next[id];
                return next;
            });
            return;
        }

        if (draftLanguages.length >= MAX_LANGUAGES) {
            setError(`Escolha no máximo ${MAX_LANGUAGES} idiomas.`);
            return;
        }

        setDraftLanguages((current) => [...current, id]);
        setDraftLanguageLevels((current) => ({
            ...current,
            [id]: current[id] ?? DEFAULT_LANGUAGE_LEVEL,
        }));
    };

    const handleSave = async () => {
        if (saving) return;
        setError(null);

        if (draftBirthdate) {
            const age = calculateAge(draftBirthdate);
            if (age === null || age < MIN_AGE) {
                setError(`É necessário ter pelo menos ${MIN_AGE} anos.`);
                return;
            }
        }

        setSaving(true);

        try {
            const updated = await updateAbout({
                bio: draftBio.trim(),
                interests: draftInterests,
                gender: draftGender || undefined,
                birthdate: draftBirthdate || null,
                country: draftCountry || null,
                city: draftCity.trim() || null,
                status: draftStatus.trim(),
                languages:
                    draftLanguages.length > 0 ? draftLanguages : undefined,
                languageLevels:
                    draftLanguages.length > 0
                        ? draftLanguageLevels
                        : undefined,
            });
            onSaved(updated);
            showToast({
                type: "success",
                message: "Perfil atualizado!",
            });
            onClose();
        } catch (err) {
            const message = getErrorMessage(
                err,
                "Erro ao atualizar o perfil.",
            );
            setError(message);
            showToast({ type: "error", message });
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Editar sobre e interesses"
        >
            <div
                className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-noir-border dark:bg-noir-surface"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-noir-border">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-noir-text-bright">
                            Sobre &amp; interesses
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-noir-text-muted">
                            Conte sobre você, seus dados e seus hobbies.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 custom-scrollbar">
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-noir-text-muted">
                            Dados pessoais
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="profile-gender"
                                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                                >
                                    Gênero
                                </label>
                                <select
                                    id="profile-gender"
                                    value={draftGender}
                                    onChange={(event) =>
                                        setDraftGender(event.target.value)
                                    }
                                    disabled={saving}
                                    className={`${fieldClass} cursor-pointer`}
                                >
                                    <option value="">Não informar</option>
                                    {GENDER_OPTIONS.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="profile-birthdate"
                                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                                >
                                    Data de nascimento
                                </label>
                                <input
                                    type="date"
                                    id="profile-birthdate"
                                    value={draftBirthdate}
                                    onChange={(event) =>
                                        setDraftBirthdate(event.target.value)
                                    }
                                    max={maxBirthdate}
                                    disabled={saving}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="profile-country"
                                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                                >
                                    País
                                </label>
                                <select
                                    id="profile-country"
                                    value={draftCountry}
                                    onChange={(event) =>
                                        setDraftCountry(event.target.value)
                                    }
                                    disabled={saving}
                                    className={`${fieldClass} cursor-pointer`}
                                >
                                    <option value="">Não informar</option>
                                    {sortedCountries.map((option) => (
                                        <option
                                            key={option.code}
                                            value={option.code}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="profile-city"
                                    className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                                >
                                    Cidade
                                </label>
                                <CityCombobox
                                    id="profile-city"
                                    value={draftCity}
                                    onChange={setDraftCity}
                                    country={draftCountry || undefined}
                                    maxLength={80}
                                    placeholder="Ex: São Paulo"
                                    className={fieldClass}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="profile-status"
                                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                            >
                                Status
                            </label>
                            <input
                                type="text"
                                id="profile-status"
                                value={draftStatus}
                                onChange={(event) =>
                                    setDraftStatus(
                                        event.target.value.slice(0, 100),
                                    )
                                }
                                maxLength={100}
                                disabled={saving}
                                placeholder="Ex: Disponível, Em reunião, Não me perturbe..."
                                className={fieldClass}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label
                                htmlFor="profile-bio"
                                className="text-xs font-medium text-slate-700 dark:text-noir-text-bright"
                            >
                                Sobre mim
                            </label>
                            <span
                                className={`text-[11px] ${
                                    draftBio.length >= MAX_BIO
                                        ? "text-red-500"
                                        : "text-slate-400 dark:text-noir-text-muted"
                                }`}
                            >
                                {draftBio.length}/{MAX_BIO}
                            </span>
                        </div>
                        <textarea
                            id="profile-bio"
                            value={draftBio}
                            onChange={(event) =>
                                setDraftBio(
                                    event.target.value.slice(0, MAX_BIO),
                                )
                            }
                            rows={5}
                            disabled={saving}
                            placeholder="Conte um pouco sobre você, seus projetos e o que gosta de fazer..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-700 dark:text-noir-text-bright">
                                Interesses
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                                {draftInterests.length}/{MAX_INTERESTS}{" "}
                                selecionados
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {INTEREST_OPTIONS.map((option) => {
                                const selected = draftInterests.includes(
                                    option.id,
                                );
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                            toggleInterest(option.id)
                                        }
                                        disabled={saving}
                                        aria-pressed={selected}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                                            selected
                                                ? "border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
                                        }`}
                                    >
                                        <span aria-hidden="true">
                                            {option.emoji}
                                        </span>
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-700 dark:text-noir-text-bright">
                                Idiomas que falo
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                                {draftLanguages.length}/{MAX_LANGUAGES}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGE_OPTIONS.map((option) => {
                                const selected = draftLanguages.includes(
                                    option.id,
                                );
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                            toggleLanguage(option.id)
                                        }
                                        disabled={saving}
                                        aria-pressed={selected}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                                            selected
                                                ? "border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
                                        }`}
                                    >
                                        <span aria-hidden="true">
                                            {option.emoji}
                                        </span>
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>

                        {draftLanguages.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                <p className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                                    Nível em cada idioma
                                </p>
                                {draftLanguages.map((code) => {
                                    const option = getLanguageOption(code);
                                    if (!option) return null;
                                    return (
                                        <div
                                            key={code}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-noir-border dark:bg-noir-surface-alt/60"
                                        >
                                            <span className="text-xs text-slate-700 dark:text-noir-text-bright">
                                                <span aria-hidden="true">
                                                    {option.emoji}
                                                </span>{" "}
                                                {option.label}
                                            </span>
                                            <select
                                                aria-label={`Nível de ${option.label}`}
                                                value={
                                                    draftLanguageLevels[
                                                        code
                                                    ] ??
                                                    DEFAULT_LANGUAGE_LEVEL
                                                }
                                                onChange={(event) => {
                                                    const value =
                                                        event.target.value;
                                                    setDraftLanguageLevels(
                                                        (current) => ({
                                                            ...current,
                                                            [code]: value,
                                                        }),
                                                    );
                                                }}
                                                disabled={saving}
                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright"
                                            >
                                                {LANGUAGE_LEVEL_OPTIONS.map(
                                                    (level) => (
                                                        <option
                                                            key={level.id}
                                                            value={level.id}
                                                        >
                                                            {level.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
                        >
                            {error}
                        </p>
                    )}
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-noir-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Salvar
                    </button>
                </footer>
            </div>
        </div>,
        document.body,
    );
}
