let audioContext: AudioContext | null = null;
let resumeListenerAttached = false;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioContext) {
        const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!Ctx) return null;
        audioContext = new Ctx();
    }
    return audioContext;
}

async function resumeOnUserGesture(): Promise<void> {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
        try {
            await ctx.resume();
        } catch {
            // Retomada falhou — tenta na próxima interação
        }
    }
}

function attachResumeListener(): void {
    if (typeof window === "undefined" || resumeListenerAttached) return;
    resumeListenerAttached = true;
    for (const event of ["pointerdown", "keydown", "touchstart"]) {
        window.addEventListener(event, resumeOnUserGesture, { once: true, capture: true });
    }
}

export function initSound(): void {
    attachResumeListener();
}

export async function playNotificationSound(): Promise<void> {
    attachResumeListener();
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        await resumeOnUserGesture();
    }
    if (ctx.state !== "running") return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
}
