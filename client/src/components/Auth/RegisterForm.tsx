import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errors";
import { reportSignupConversion } from "../../lib/ads";
import { COUNTRIES } from "../../utils/countries";
import {
    DEFAULT_LANGUAGE_LEVEL,
    GENDER_OPTIONS,
    LANGUAGE_LEVEL_OPTIONS,
    LANGUAGE_OPTIONS,
    LANGUAGE_REGIONS,
    MAX_AGE,
    MAX_LANGUAGES,
    MIN_AGE,
    calculateAge,
    getLanguageOption,
} from "@shared/profile";
import api from "../../services/api";
import { filterOptions } from "../../utils/options";
import CityCombobox from "../ui/CityCombobox";
import OptionSearch from "../ui/OptionSearch";
import AuthSubmitButton from "./AuthSubmitButton";
import RegisterProgress from "./RegisterProgress";

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

const sortedCountries = [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
);

const labelClass = "block text-xs font-semibold text-zinc-300";

const fieldIconClass =
    "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500";

const inputClass =
    "w-full rounded-xl bg-[#131c13]/90 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150";

const iconInputClass =
    "w-full rounded-xl bg-[#131c13]/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maxBirthdate = (() => {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - MIN_AGE);
    return date.toISOString().slice(0, 10);
})();

const STEPS = [
    {
        title: "Sua conta",
        description: "Defina como você vai entrar no ConvoTalk.",
    },
    {
        title: "Sobre você",
        description: "Esses dados aparecem no seu perfil.",
    },
    {
        title: "Onde você mora",
        description: "Ajuda a encontrar pessoas por perto.",
    },
    {
        title: "Idiomas e termos",
        description: "Escolha os idiomas que você fala.",
    },
] as const;

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const { register } = useAuth();
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [languages, setLanguages] = useState<string[]>([]);
    const [languageLevels, setLanguageLevels] = useState<
        Record<string, string>
    >({});
    const [languageQuery, setLanguageQuery] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const headingRef = useRef<HTMLHeadingElement>(null);
    const isFirstRender = useRef(true);
    const isLastStep = step === STEPS.length - 1;

    const availableLanguages = filterOptions(LANGUAGE_OPTIONS, languageQuery);
    const languageGroups = LANGUAGE_REGIONS.map((region) => ({
        region,
        options: availableLanguages.filter(
            (option) => option.region === region,
        ),
    })).filter((group) => group.options.length > 0);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        headingRef.current?.focus();
    }, [step]);

    const clearError = () => {
        if (error) setError("");
    };

    const toggleLanguage = (id: string) => {
        clearError();
        if (languages.includes(id)) {
            setLanguages((current) =>
                current.filter((language) => language !== id),
            );
            setLanguageLevels((current) => {
                const next = { ...current };
                delete next[id];
                return next;
            });
            return;
        }
        if (languages.length >= MAX_LANGUAGES) return;
        setLanguages((current) => [...current, id]);
        setLanguageLevels((current) => ({
            ...current,
            [id]: current[id] ?? DEFAULT_LANGUAGE_LEVEL,
        }));
    };

    const validateStep = (index: number): string | null => {
        switch (index) {
            case 0:
                if (name.trim().length < 2) return "Informe seu nome.";
                if (!EMAIL_PATTERN.test(email.trim())) return "Email inválido.";
                if (password.length < 8) {
                    return "A senha deve ter pelo menos 8 caracteres.";
                }
                return null;
            case 1: {
                if (!gender) return "Selecione seu gênero.";
                if (!birthdate) return "Informe sua data de nascimento.";
                const age = calculateAge(birthdate);
                if (age === null || age < MIN_AGE) {
                    return `É necessário ter pelo menos ${MIN_AGE} anos.`;
                }
                if (age > MAX_AGE) return "Data de nascimento inválida.";
                return null;
            }
            case 2:
                if (!country) return "Selecione seu país.";
                if (!city.trim()) return "Informe sua cidade.";
                return null;
            case 3:
                if (languages.length === 0) {
                    return "Selecione pelo menos um idioma.";
                }
                if (!acceptedTerms) {
                    return "Você precisa aceitar os Termos de Uso e a Política de Privacidade.";
                }
                return null;
            default:
                return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError("");

        if (!isLastStep) {
            const stepError = validateStep(step);
            if (stepError) {
                setError(stepError);
                return;
            }
            setStep((current) => current + 1);
            return;
        }

        for (let index = 0; index < STEPS.length; index += 1) {
            const stepError = validateStep(index);
            if (stepError) {
                setStep(index);
                setError(stepError);
                return;
            }
        }

        setLoading(true);

        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                password,
                gender,
                birthdate,
                country,
                city: city.trim(),
                languages,
                languageLevels,
            });
            reportSignupConversion();
            setRegisteredEmail(email.trim());
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conta"));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (loading) return;
        setError("");
        setStep((current) => Math.max(0, current - 1));
    };

    const handleResend = async () => {
        if (!registeredEmail) return;
        setResending(true);
        setResendMessage("");
        try {
            await api.post("/auth/resend-verification", {
                email: registeredEmail,
            });
            setResendMessage(
                "Se o email for válido e ainda não confirmado, enviamos um novo link de confirmação.",
            );
        } catch (err: unknown) {
            setResendMessage(getErrorMessage(err, "Erro ao reenviar email"));
        } finally {
            setResending(false);
        }
    };

    if (registeredEmail) {
        return (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#00a84b] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h2 className="text-white text-lg font-semibold">
                    Verifique seu email
                </h2>
                <p className="text-zinc-400 text-sm">
                    Se o email for válido, enviamos um link de confirmação para{" "}
                    <span className="text-white font-medium">
                        {registeredEmail}
                    </span>
                </p>
                <p className="text-zinc-500 text-xs">
                    Clique no link no email para ativar sua conta.
                </p>

                {resendMessage && (
                    <div
                        className={`text-sm px-4 py-2 rounded-xl ${
                            resendMessage.includes("Erro")
                                ? "bg-red-500/10 border border-red-500/50 text-red-400"
                                : "bg-green-500/10 border border-green-500/50 text-green-400"
                        }`}
                    >
                        {resendMessage}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full py-3 bg-zinc-800/90 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm border border-white/10"
                >
                    {resending ? "Reenviando..." : "Reenviar email"}
                </button>

                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="w-full py-3 px-4 bg-[#00a84b] hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                    Ir para o login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" method="POST" noValidate>
            <RegisterProgress current={step + 1} total={STEPS.length} />

            {error && (
                <div
                    role="alert"
                    className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm"
                >
                    {error}
                </div>
            )}

            <div key={step} className="min-h-[170px] animate-slideInRight">
                <div className="space-y-1">
                    <h3
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-base font-semibold text-white outline-none"
                    >
                        {STEPS[step].title}
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {STEPS[step].description}
                    </p>
                </div>

                <div className="mt-4 space-y-4">
                    {step === 0 && (
                        <>
                            <div className="space-y-1.5">
                                <label htmlFor="name" className={labelClass}>
                                    Nome
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className={fieldIconClass}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        autoComplete="name"
                                        placeholder="Seu nome"
                                        aria-label="Nome"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            clearError();
                                        }}
                                        required
                                        maxLength={50}
                                        className={iconInputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="register-email"
                                    className={labelClass}
                                >
                                    E-mail
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className={fieldIconClass}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        id="register-email"
                                        autoComplete="email"
                                        placeholder="seu@email.com"
                                        aria-label="Email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            clearError();
                                        }}
                                        required
                                        maxLength={100}
                                        className={iconInputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="register-password"
                                    className={labelClass}
                                >
                                    Senha
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className={fieldIconClass}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        id="register-password"
                                        autoComplete="new-password"
                                        placeholder="Mínimo 8 caracteres"
                                        aria-label="Senha"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearError();
                                        }}
                                        required
                                        minLength={8}
                                        maxLength={128}
                                        className={`${iconInputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Ocultar senha"
                                                : "Mostrar senha"
                                        }
                                        className={`absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors focus:outline-none ${
                                            showPassword
                                                ? "text-emerald-400"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="register-gender"
                                        className={labelClass}
                                    >
                                        Gênero
                                    </label>
                                    <select
                                        id="register-gender"
                                        name="gender"
                                        value={gender}
                                        onChange={(e) => {
                                            setGender(e.target.value);
                                            clearError();
                                        }}
                                        required
                                        className={`${inputClass} cursor-pointer`}
                                    >
                                        <option value="">Selecione</option>
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

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="register-birthdate"
                                        className={labelClass}
                                    >
                                        Data de nascimento
                                    </label>
                                    <input
                                        type="date"
                                        id="register-birthdate"
                                        name="birthdate"
                                        value={birthdate}
                                        onChange={(e) => {
                                            setBirthdate(e.target.value);
                                            clearError();
                                        }}
                                        max={maxBirthdate}
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] leading-relaxed text-zinc-500">
                                Mostramos apenas a sua idade no perfil — a data
                                completa fica privada.
                            </p>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="register-country"
                                        className={labelClass}
                                    >
                                        País
                                    </label>
                                    <select
                                        id="register-country"
                                        name="country"
                                        value={country}
                                        onChange={(e) => {
                                            setCountry(e.target.value);
                                            clearError();
                                        }}
                                        required
                                        className={`${inputClass} cursor-pointer`}
                                    >
                                        <option value="">Selecione</option>
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

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="register-city"
                                        className={labelClass}
                                    >
                                        Cidade
                                    </label>
                                    <CityCombobox
                                        id="register-city"
                                        value={city}
                                        onChange={(value) => {
                                            setCity(value);
                                            clearError();
                                        }}
                                        country={country || undefined}
                                        maxLength={80}
                                        placeholder="Ex: São Paulo"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] leading-relaxed text-zinc-500">
                                Cidade e país aparecem no seu perfil para
                                aproximar você de outras pessoas.
                            </p>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-300">
                                        Idiomas que falo
                                    </span>
                                    <span className="text-[11px] text-zinc-500">
                                        {languages.length}/{MAX_LANGUAGES}
                                    </span>
                                </div>

                                <OptionSearch
                                    value={languageQuery}
                                    onChange={setLanguageQuery}
                                    placeholder="Buscar idiomas..."
                                    label="Buscar idiomas"
                                    className="w-full rounded-lg border border-white/10 bg-[#131c13]/60 py-2 pl-8 pr-2.5 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500/50"
                                />

                                <div className="max-h-56 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                    {languageGroups.map((group) => (
                                        <div key={group.region}>
                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                                {group.region}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {group.options.map((option) => {
                                                    const selected =
                                                        languages.includes(
                                                            option.id,
                                                        );
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleLanguage(
                                                                    option.id,
                                                                )
                                                            }
                                                            aria-pressed={
                                                                selected
                                                            }
                                                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                                                selected
                                                                    ? "border-emerald-500/40 bg-emerald-600/20 text-emerald-300"
                                                                    : "border-white/10 bg-[#131c13]/60 text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-300"
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
                                    ))}

                                    {languageGroups.length === 0 && (
                                        <p className="rounded-lg border border-dashed border-white/10 p-2.5 text-center text-[11px] text-zinc-500">
                                            Nenhum idioma encontrado para “
                                            {languageQuery}”.
                                        </p>
                                    )}
                                </div>

                                {languages.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[11px] text-zinc-500">
                                            Nível em cada idioma
                                        </span>
                                        {languages.map((code) => {
                                            const option =
                                                getLanguageOption(code);
                                            if (!option) return null;
                                            return (
                                                <div
                                                    key={code}
                                                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#131c13]/60 px-2.5 py-1.5"
                                                >
                                                    <span className="text-[11px] text-zinc-300">
                                                        <span aria-hidden="true">
                                                            {option.emoji}
                                                        </span>{" "}
                                                        {option.label}
                                                    </span>
                                                    <select
                                                        aria-label={`Nível de ${option.label}`}
                                                        value={
                                                            languageLevels[
                                                                code
                                                            ] ??
                                                            DEFAULT_LANGUAGE_LEVEL
                                                        }
                                                        onChange={(event) => {
                                                            const value =
                                                                event.target
                                                                    .value;
                                                            setLanguageLevels(
                                                                (current) => ({
                                                                    ...current,
                                                                    [code]: value,
                                                                }),
                                                            );
                                                        }}
                                                        className="rounded-lg border border-white/10 bg-[#0f170f] px-2 py-1 text-[11px] text-zinc-200 focus:border-emerald-500 focus:outline-none"
                                                    >
                                                        {LANGUAGE_LEVEL_OPTIONS.map(
                                                            (level) => (
                                                                <option
                                                                    key={
                                                                        level.id
                                                                    }
                                                                    value={
                                                                        level.id
                                                                    }
                                                                >
                                                                    {
                                                                        level.label
                                                                    }
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

                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="acceptedTerms"
                                    id="acceptedTerms"
                                    checked={acceptedTerms}
                                    onChange={(e) => {
                                        setAcceptedTerms(e.target.checked);
                                        clearError();
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#131c13] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                                />
                                <span className="text-zinc-400 text-xs leading-relaxed">
                                    Li e aceito os{" "}
                                    <a
                                        href="/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                                    >
                                        Termos de Uso
                                    </a>{" "}
                                    e a{" "}
                                    <a
                                        href="/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                                    >
                                        Política de Privacidade
                                    </a>
                                    .
                                </span>
                            </label>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={loading}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Voltar
                    </button>
                )}
                <div className="min-w-0 flex-1">
                    <AuthSubmitButton
                        loading={loading}
                        disabled={isLastStep && !acceptedTerms}
                        label={isLastStep ? "Criar conta" : "Continuar"}
                        loadingLabel="Criando conta..."
                    />
                </div>
            </div>
        </form>
    );
}
