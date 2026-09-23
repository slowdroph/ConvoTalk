export const GOOGLE_ADS_SIGNUP_SEND_TO =
    "AW-16805873570/5h-cCPeM_oEdEKKP1c0-";

type GtagFn = (
    command: "event",
    eventName: "conversion",
    params: { send_to: string },
) => void;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: GtagFn;
    }
}

export function reportSignupConversion(): void {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_SIGNUP_SEND_TO,
    });
}
