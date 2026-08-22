import { useEffect, useRef, useState } from "react";

interface AudioRecorderProps {
    onCancel: () => void;
    onFinish: (blob: Blob) => void;
}

const MAX_RECORDING_MS = 60_000;

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AudioRecorder({
    onCancel,
    onFinish,
}: AudioRecorderProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState("");

    const cleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        mediaRecorderRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                const mimeType = MediaRecorder.isTypeSupported(
                    "audio/webm;codecs=opus",
                )
                    ? "audio/webm;codecs=opus"
                    : "audio/webm";
                const recorder = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = recorder;
                chunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, {
                        type: mimeType,
                    });
                    if (!cancelled) onFinish(blob);
                };

                recorder.start();
                timerRef.current = setInterval(() => {
                    setElapsed((prev) => {
                        if (prev + 1000 >= MAX_RECORDING_MS) {
                            stopRecording();
                            return MAX_RECORDING_MS;
                        }
                        return prev + 1000;
                    });
                }, 1000);
            } catch {
                setError("Não foi possível acessar o microfone.");
            }
        };

        const stopRecording = () => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };

        startRecording();

        return () => {
            cancelled = true;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700">
            <span
                className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0"
                aria-hidden
            />
            <span className="text-sm text-white tabular-nums font-medium">
                {formatDuration(elapsed)}
            </span>
            <div className="flex items-center gap-2 h-6 flex-1" aria-hidden>
                {Array.from({ length: 24 }).map((_, i) => (
                    <span
                        key={i}
                        className="w-0.5 rounded-full bg-green-400 animate-pulse"
                        style={{
                            height: `${6 + Math.abs(Math.sin(elapsed / 200 + i)) * 18}px`,
                            animationDelay: `${i * 45}ms`,
                        }}
                    />
                ))}
            </div>
            {error && <span className="text-xs text-red-400">{error}</span>}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        if (mediaRecorderRef.current?.state === "recording") {
                            mediaRecorderRef.current.stop();
                        }
                    }}
                    disabled={Boolean(error)}
                    className="p-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white transition-colors"
                    title="Enviar áudio"
                    aria-label="Enviar áudio"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        cleanup();
                        onCancel();
                    }}
                    className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
                    title="Cancelar gravação"
                    aria-label="Cancelar gravação"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                </button>
            </div>
        </div>
    );
}
