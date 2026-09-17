interface SectionHeaderProps {
    badge: string;
    title: string;
    subtitle: string;
    align?: "center" | "left";
}

export default function SectionHeader({
    badge,
    title,
    subtitle,
    align = "center",
}: SectionHeaderProps) {
    return (
        <>
            <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface mt-4">
                {title}
            </h2>
            {align === "center" ? (
                <p className="mt-4 text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
                    {subtitle}
                </p>
            ) : (
                <p className="mt-3 text-base text-on-surface-variant leading-relaxed">
                    {subtitle}
                </p>
            )}
        </>
    );
}
