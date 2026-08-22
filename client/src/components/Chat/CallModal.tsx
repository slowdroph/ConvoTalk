import { useEffect, useRef } from "react";
import type { CallPhase, CallType } from "../../hooks/useWebRTC";
import Avatar from "../ui/Avatar";

function VideoView({
    stream,
    muted,
    className,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    className?: string;
}) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={ref}
            autoPlay
            playsInline
            muted={muted}
            className={className}
        />
    );
}

function ControlButton({
    onClick,
    active,
    danger,
    label,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                danger
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : active
                      ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
            }`}
        >
            {children}
        </button>
    );
}

interface CallModalProps {
    phase: CallPhase;
    callType: CallType;
    remoteName: string;
    remoteAvatar?: string;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    muted: boolean;
    cameraOff: boolean;
    isOtherOnline: boolean;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
    onToggleMute: () => void;
    onToggleCamera: () => void;
}

export default function CallModal({
    phase,
    callType,
    remoteName,
    remoteAvatar,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    isOtherOnline,
    onAccept,
    onReject,
    onEnd,
    onToggleMute,
    onToggleCamera,
}: CallModalProps) {
    if (phase === "idle") return null;

    const isVideo = callType === "video";
    const hasRemote = Boolean(remoteStream);

    return (
        <div className="fixed inset-x-0 top-0 z-50 h-dvh-fallback bg-zinc-950/95 flex flex-col">
            {/* Video remote */}
            {phase === "active" && isVideo ? (
                <div className="flex-1 relative bg-black">
                    {hasRemote ? (
                        <VideoView
                            stream={remoteStream}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <Avatar
                                src={remoteAvatar}
                                name={remoteName}
                                size="lg"
                            />
                            <p className="text-white text-lg font-semibold">
                                {remoteName}
                            </p>
                            <p className="text-zinc-400 text-sm">
                                Conectando...
                            </p>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 w-28 h-20 sm:w-32 sm:h-24 rounded-lg overflow-hidden border-2 border-zinc-600">
                        {localStream && !cameraOff ? (
                            <VideoView
                                stream={localStream}
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <Avatar
                                    src={remoteAvatar}
                                    name={remoteName}
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                    <Avatar src={remoteAvatar} name={remoteName} size="lg" />
                    <div className="text-center">
                        <p className="text-white text-xl font-semibold">
                            {remoteName}
                        </p>
                        {phase === "incoming" && (
                            <p className="text-zinc-400 text-sm mt-1">
                                Chamada de {isVideo ? "vídeo" : "áudio"}{" "}
                                recebida
                            </p>
                        )}
                        {phase === "outgoing" && (
                            <p className="text-zinc-400 text-sm mt-1">
                                {isOtherOnline
                                    ? "Chamando..."
                                    : "Usuário indisponível no momento"}
                            </p>
                        )}
                        {phase === "active" && (
                            <p className="text-zinc-400 text-sm mt-1">
                                Em chamada
                            </p>
                        )}
                    </div>
                    {phase === "active" && !isVideo && (
                        <div className="flex items-end gap-1 h-12" aria-hidden>
                            {Array.from({ length: 18 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="w-1 rounded-full bg-green-500 animate-pulse"
                                    style={{
                                        height: `${20 + ((i * 17) % 28)}px`,
                                        animationDelay: `${i * 60}ms`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
                {phase === "incoming" ? (
                    <>
                        <ControlButton
                            onClick={onReject}
                            danger
                            label="Recusar"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </ControlButton>
                        <ControlButton
                            onClick={onAccept}
                            label="Aceitar"
                            active
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                            </svg>
                        </ControlButton>
                    </>
                ) : (
                    <>
                        {phase === "active" && (
                            <>
                                <ControlButton
                                    onClick={onToggleMute}
                                    active={muted}
                                    label={
                                        muted ? "Ativar microfone" : "Silenciar"
                                    }
                                >
                                    {muted ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16.5 15.5a4 4 0 000-7M19 11a4 4 0 010 3"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 11a2 2 0 002-2V6a2 2 0 10-4 0v3a2 2 0 002 2z"
                                            />
                                        </svg>
                                    )}
                                </ControlButton>
                                {isVideo && (
                                    <ControlButton
                                        onClick={onToggleCamera}
                                        active={cameraOff}
                                        label={
                                            cameraOff
                                                ? "Ligar câmera"
                                                : "Desligar câmera"
                                        }
                                    >
                                        {cameraOff ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                                <line
                                                    x1="3"
                                                    y1="3"
                                                    x2="21"
                                                    y2="21"
                                                />
                                            </svg>
                                        )}
                                    </ControlButton>
                                )}
                            </>
                        )}
                        <ControlButton
                            onClick={phase === "outgoing" ? onEnd : onEnd}
                            danger
                            label="Encerrar"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                            </svg>
                        </ControlButton>
                    </>
                )}
            </div>
        </div>
    );
}
