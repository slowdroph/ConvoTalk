import { useState } from "react";
import {
    getSoundEnabled,
    setSoundEnabled,
    getBrowserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    getTitleBadgeEnabled,
    setTitleBadgeEnabled,
} from "../../utils/notificationPrefs";

function ToggleRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div>
                <p className="text-slate-900 font-medium text-sm dark:text-white">{title}</p>
                <p className="text-slate-500 text-xs dark:text-zinc-400">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                    checked ? "bg-emerald-600 dark:bg-green-600" : "bg-slate-300 dark:bg-zinc-700"
                }`}
            >
                <span
                    className={`absolute left-0 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-[24px]" : "translate-x-[2px]"
                    }`}
                />
            </button>
        </div>
    );
}

export default function NotificationSettings() {
    const [sound, setSound] = useState(getSoundEnabled);
    const [browser, setBrowser] = useState(getBrowserNotificationsEnabled);
    const [titleBadge, setTitleBadge] = useState(getTitleBadgeEnabled);

    const handleSoundChange = (value: boolean) => {
        setSound(value);
        setSoundEnabled(value);
    };

    const handleBrowserChange = (value: boolean) => {
        setBrowser(value);
        setBrowserNotificationsEnabled(value);
        if (value && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };

    const handleTitleBadgeChange = (value: boolean) => {
        setTitleBadge(value);
        setTitleBadgeEnabled(value);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">
                Notificações
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                <ToggleRow
                    title="Som de notificação"
                    description="Reproduz um som quando uma nova mensagem chega."
                    checked={sound}
                    onChange={handleSoundChange}
                />
                <ToggleRow
                    title="Notificações do navegador"
                    description="Mostra um popup quando a aba está em segundo plano."
                    checked={browser}
                    onChange={handleBrowserChange}
                />
                <ToggleRow
                    title="Contador no título"
                    description="Exibe o número de mensagens não lidas no título da aba."
                    checked={titleBadge}
                    onChange={handleTitleBadgeChange}
                />
            </div>
        </div>
    );
}
