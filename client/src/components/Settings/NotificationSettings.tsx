import { useState, useEffect } from "react";
import {
    getSoundEnabled,
    setSoundEnabled,
    getBrowserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    getTitleBadgeEnabled,
    setTitleBadgeEnabled,
} from "../../utils/notificationPrefs";
import {
    isPushSupported,
    getCurrentPushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
} from "../../services/push";

function ToggleRow({
    title,
    description,
    checked,
    disabled = false,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div>
                <p className="text-slate-900 font-medium text-sm dark:text-white">
                    {title}
                </p>
                <p className="text-slate-500 text-xs dark:text-zinc-400">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                    checked
                        ? "bg-emerald-600 dark:bg-green-600"
                        : "bg-slate-300 dark:bg-zinc-700"
                }`}
            >
                <span
                    className={`absolute left-0 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-6" : "translate-x-0.5"
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
    const [pushLoading, setPushLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<
        NotificationPermission | "unsupported"
    >(() => (isPushSupported() ? Notification.permission : "unsupported"));

    useEffect(() => {
        if (!isPushSupported()) {
            return;
        }

        let cancelled = false;

        // Verifica se já existe inscrição ativa no navegador
        getCurrentPushSubscription().then((sub) => {
            if (!cancelled && sub && Notification.permission === "granted") {
                setBrowser(true);
                setBrowserNotificationsEnabled(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSoundChange = (value: boolean) => {
        setSound(value);
        setSoundEnabled(value);
    };

    const handleBrowserChange = async (value: boolean) => {
        if (!isPushSupported()) {
            setBrowser(value);
            setBrowserNotificationsEnabled(value);
            return;
        }

        setPushLoading(true);
        try {
            if (value) {
                const permission = await Notification.requestPermission();
                setPermissionStatus(permission);

                if (permission === "granted") {
                    const success = await subscribeToPush();
                    if (success) {
                        setBrowser(true);
                        setBrowserNotificationsEnabled(true);
                    } else {
                        setBrowser(false);
                        setBrowserNotificationsEnabled(false);
                    }
                } else {
                    setBrowser(false);
                    setBrowserNotificationsEnabled(false);
                }
            } else {
                setBrowser(false);
                setBrowserNotificationsEnabled(false);
                await unsubscribeFromPush();
            }
        } catch (err) {
            console.error("Erro ao alternar notificações push:", err);
        } finally {
            setPushLoading(false);
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

            {permissionStatus === "denied" && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                        warning
                    </span>
                    <span>
                        As notificações estão bloqueadas nas configurações do seu navegador.
                        Para ativá-las, permita as notificações para este site nas opções do navegador.
                    </span>
                </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                <ToggleRow
                    title="Som de notificação"
                    description="Reproduz um som quando uma nova mensagem chega."
                    checked={sound}
                    onChange={handleSoundChange}
                />
                <ToggleRow
                    title="Notificações Push / Navegador"
                    description="Receba avisos de novas mensagens mesmo em segundo plano ou com a aba fechada."
                    checked={browser}
                    disabled={pushLoading || permissionStatus === "denied"}
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
