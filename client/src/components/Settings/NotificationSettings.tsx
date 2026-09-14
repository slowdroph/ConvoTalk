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
            <div className="pr-3">
                <h3 className="text-xs font-semibold text-noir-text-bright">
                    {title}
                </h3>
                <p className="text-[11px] text-noir-text-muted mt-0.5 leading-relaxed">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                    disabled
                        ? "opacity-50 cursor-not-allowed bg-noir-surface-alt"
                        : "cursor-pointer " + (checked ? "bg-emerald-500" : "bg-noir-border-light")
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        checked ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

export default function NotificationSettings() {
    const [sound, setSound] = useState(getSoundEnabled);
    const [browser, setBrowser] = useState(
        () =>
            isPushSupported() &&
            Notification.permission === "granted" &&
            getBrowserNotificationsEnabled(),
    );
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
            if (cancelled) return;
            if (sub && Notification.permission === "granted") {
                setBrowser(true);
                setBrowserNotificationsEnabled(true);
            } else {
                setBrowser(false);
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
        <div className="space-y-5">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    Notificações
                </h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    Ajuste como e quando você recebe alertas no sistema.
                </p>
            </div>

            {permissionStatus === "denied" && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                        As notificações estão bloqueadas nas configurações do seu navegador.
                        Para ativá-las, permita as notificações para este site nas opções do navegador.
                    </span>
                </div>
            )}

            <div className="space-y-4 divide-y divide-noir-border/60">
                <ToggleRow
                    title="Som de notificação"
                    description="Reproduz um som quando uma nova mensagem chega."
                    checked={sound}
                    onChange={handleSoundChange}
                />
                <div className="pt-3">
                    <ToggleRow
                        title="Notificações Push / Navegador"
                        description="Receba avisos de novas mensagens mesmo em segundo plano ou com a aba fechada."
                        checked={browser}
                        disabled={pushLoading || permissionStatus === "denied"}
                        onChange={handleBrowserChange}
                    />
                </div>
                <div className="pt-3">
                    <ToggleRow
                        title="Contador no título"
                        description="Exibe o número de mensagens não lidas no título da aba."
                        checked={titleBadge}
                        onChange={handleTitleBadgeChange}
                    />
                </div>
            </div>
        </div>
    );
}
