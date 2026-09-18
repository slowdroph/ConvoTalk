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
        window.addEventListener(event, resumeOnUserGesture, {
            once: true,
            capture: true,
        });
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

let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

function playRingtonePulse(ctx: AudioContext): void {
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 480;
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.3);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
}

export function playRingtone(): void {
    attachResumeListener();
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        void resumeOnUserGesture();
    }
    if (ringtoneInterval) return;
    playRingtonePulse(ctx);
    ringtoneInterval = setInterval(() => {
        const c = getAudioContext();
        if (c && c.state === "running") playRingtonePulse(c);
    }, 1600);
}

export function stopRingtone(): void {
    if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
        ringtoneInterval = null;
    }
}
