const SIZE_CLASSES = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-20 h-20 text-2xl",
} as const;

const COLORS = [
    "bg-green-600",
    "bg-blue-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-orange-600",
    "bg-teal-600",
    "bg-indigo-600",
    "bg-rose-600",
];

function getColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

interface AvatarProps {
    src?: string;
    name: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

export default function Avatar({
    src,
    name,
    size = "md",
    className = "",
}: AvatarProps) {
    const sizeClass = SIZE_CLASSES[size];
    const initial = name.charAt(0).toUpperCase();

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center text-on-accent font-bold shrink-0 ${className}`}
        >
            {initial}
        </div>
    );
}
