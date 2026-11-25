import { ICON_PATHS } from "./iconPaths";

interface IconProps {
    name: string;
    filled?: boolean;
    className?: string;
    title?: string;
}

export default function Icon({
    name,
    filled = false,
    className = "",
    title,
}: IconProps) {
    const paths = ICON_PATHS[name];
    if (!paths) return null;

    return (
        <svg
            viewBox="0 -960 960 960"
            width="1em"
            height="1em"
            fill="currentColor"
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
            className={`inline-block shrink-0 ${className}`}
        >
            {title && <title>{title}</title>}
            <path d={filled ? paths.filled : paths.outline} />
        </svg>
    );
}
