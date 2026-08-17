import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "danger" | "secondary" | "secondaryLight";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

const baseClasses =
    "px-2 py-1 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-green-600 hover:bg-green-700 text-on-accent",
    danger: "bg-red-600 hover:bg-red-700 text-on-accent",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
    secondaryLight:
        "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-zinc-300",
};

export default function Button({
    variant = "secondary",
    className = "",
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
            {...props}
        />
    );
}
