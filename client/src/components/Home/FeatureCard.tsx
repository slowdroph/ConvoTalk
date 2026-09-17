import IconBadge from "./IconBadge";

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    filled?: boolean;
}

export default function FeatureCard({
    icon,
    title,
    description,
    filled = true,
}: FeatureCardProps) {
    return (
        <div className="glass-card glass-card-hover p-6 rounded-xl transition-all h-full">
            <div className="w-12 h-12 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
                <IconBadge name={icon} filled={filled} size="xl" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">
                {title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
                {description}
            </p>
        </div>
    );
}
