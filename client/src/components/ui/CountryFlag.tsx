import { createElement, useEffect, useState } from "react";
import { FLAG_LOADERS, type FlagComponent } from "./flagLoaders";

const loadedFlags = new Map<string, FlagComponent>();
const pendingLoads = new Map<string, Promise<FlagComponent>>();

function loadFlag(code: string): Promise<FlagComponent> {
    const cached = loadedFlags.get(code);
    if (cached) return Promise.resolve(cached);

    const pending = pendingLoads.get(code);
    if (pending) return pending;

    const loader = FLAG_LOADERS[code];
    if (!loader) {
        return Promise.reject(new Error(`Sem bandeira para o código ${code}`));
    }

    const promise = loader()
        .then((mod) => {
            loadedFlags.set(code, mod.default);
            pendingLoads.delete(code);
            return mod.default;
        })
        .catch((err) => {
            pendingLoads.delete(code);
            throw err;
        });

    pendingLoads.set(code, promise);
    return promise;
}

interface CountryFlagProps {
    country?: string | null;
    name?: string;
    className?: string;
}

export default function CountryFlag({
    country,
    name,
    className = "w-5 h-4",
}: CountryFlagProps) {
    const code = country ? country.toUpperCase() : "";
    const [resolved, setResolved] = useState<{
        code: string;
        component: FlagComponent;
    } | null>(null);
    const [failedCode, setFailedCode] = useState<string | null>(null);

    useEffect(() => {
        if (!code || !FLAG_LOADERS[code] || loadedFlags.has(code)) return;

        let active = true;
        loadFlag(code)
            .then((component) => {
                if (active) {
                    setResolved({ code, component });
                    setFailedCode(null);
                }
            })
            .catch(() => {
                // Chunk falhou: renderiza vazio; um remount tenta de novo
                // (loadedFlags/pendingLoads não retêm a falha).
                if (active) setFailedCode(code);
            });
        return () => {
            active = false;
        };
    }, [code]);

    const cached = code ? loadedFlags.get(code) : undefined;
    const current =
        resolved && resolved.code === code ? resolved.component : undefined;
    // Evita flicker na troca de país: mantém a bandeira anterior visível
    // apenas enquanto a nova carrega (mesmo padrão de um <img> trocando src).
    const fallback =
        current || !code || !FLAG_LOADERS[code] || failedCode === code
            ? undefined
            : resolved?.component;
    const Flag = cached ?? current ?? fallback;

    if (!code || !Flag) return null;

    return createElement(Flag, {
        title: name || code,
        className: `${className} inline-block rounded-[2px] shrink-0`,
        role: "img",
        "aria-label": name || `Bandeira de ${code}`,
    });
}
