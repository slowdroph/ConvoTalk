import type { ComponentProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@shared/i18n";
import {
    languageFromPath,
    localizePath,
    PUBLIC_PATHS,
} from "../../i18n/routing";

type Props = ComponentProps<typeof Link>;

/**
 * Public pages live under a locale prefix, so their internal links must keep
 * it. App routes (/chat, /settings, ...) are unprefixed and pass through.
 */
export default function LocalizedLink({ to, ...props }: Props) {
    const { pathname } = useLocation();
    const language = languageFromPath(pathname) ?? DEFAULT_LANGUAGE;

    if (typeof to !== "string") return <Link to={to} {...props} />;

    const match = /^([^?#]*)(.*)$/.exec(to);
    const path = match?.[1] ?? to;
    const suffix = match?.[2] ?? "";

    if (!PUBLIC_PATHS.includes(path)) return <Link to={to} {...props} />;

    return <Link to={`${localizePath(language, path)}${suffix}`} {...props} />;
}
