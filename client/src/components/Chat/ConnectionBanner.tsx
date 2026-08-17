import { useSocket } from "../../hooks/useSocket";

const MAX_ATTEMPTS = 20;

export default function ConnectionBanner() {
    const { connected, reconnecting, reconnectAttempt, hasConnectedOnce } =
        useSocket();

    if (connected) return null;
    if (!hasConnectedOnce && !reconnecting) return null;

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center gap-2 dark:bg-yellow-500/10 dark:border-yellow-500/30">
            {reconnecting ? (
                <>
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-yellow-700 text-sm dark:text-yellow-400">
                        Conexão perdida. Tentando reconectar (
                        {reconnectAttempt}/{MAX_ATTEMPTS})...
                    </p>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 flex-shrink-0 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m2.829-15.557a14.999 14.999 0 010 21.212m-5.658-5.657a4.5 4.5 0 010-6.364M6.343 17.657a9 9 0 010-12.728M3.514 21.899a15 15 0 010-21.212M8.464 14.536a4.5 4.5 0 000-6.364M12 12h.01" />
                    </svg>
                    <p className="text-red-600 text-sm dark:text-red-400">
                        Sem conexão. Verifique sua internet.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs rounded-lg transition-colors dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-zinc-200"
                    >
                        Reconectar
                    </button>
                </>
            )}
        </div>
    );
}