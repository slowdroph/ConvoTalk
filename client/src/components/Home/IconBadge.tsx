import Icon from "../ui/Icon";

interface IconBadgeProps {
    name: string;
    filled?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

const sizeMap: Record<string, string> = {
    sm: "text-[14px]",
    md: "text-[18px]",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
};

export default function IconBadge({
    name,
    filled = true,
    size = "md",
    className,
}: IconBadgeProps) {
    return (
        <Icon
            name={name}
            filled={filled}
            className={`${sizeMap[size]} ${className ?? ""}`}
        />
    );
}
