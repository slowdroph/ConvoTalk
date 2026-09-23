import { describe, it, expect, vi, afterEach } from "vitest";
import {
    GOOGLE_ADS_SIGNUP_SEND_TO,
    reportSignupConversion,
} from "../../lib/ads";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("reportSignupConversion", () => {
    it("dispara conversão do Google Ads com o send_to da meta Inscrição", () => {
        const gtag = vi.fn();
        window.gtag = gtag;
        reportSignupConversion();
        expect(gtag).toHaveBeenCalledTimes(1);
        expect(gtag).toHaveBeenCalledWith("event", "conversion", {
            send_to: GOOGLE_ADS_SIGNUP_SEND_TO,
        });
        expect(GOOGLE_ADS_SIGNUP_SEND_TO).toBe(
            "AW-16805873570/5h-cCPeM_oEdEKKP1c0-",
        );
        delete window.gtag;
    });

    it("não quebra quando o gtag está bloqueado (adblock)", () => {
        delete window.gtag;
        expect(() => reportSignupConversion()).not.toThrow();
    });
});
