import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../services/email", () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendAlreadyRegisteredEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendEmailChangeConfirmation: vi.fn().mockResolvedValue(undefined),
}));

import {
    enqueueEmail,
    flushEmailQueue,
    getEmailQueueLength,
} from "../services/emailQueue";
import {
    sendVerificationEmail,
    sendAlreadyRegisteredEmail,
} from "../services/email";

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe("emailQueue", () => {
    it("entrega job enfileirado e esvazia a fila", async () => {
        enqueueEmail({
            kind: "verification",
            to: "ana@test.com",
            name: "Ana",
            token: "tok",
        });

        await flushEmailQueue();

        expect(sendVerificationEmail).toHaveBeenCalledWith(
            "ana@test.com",
            "Ana",
            "tok",
        );
        expect(getEmailQueueLength()).toBe(0);
    });

    it("reagenda após falha transitória e entrega na retry", async () => {
        vi.useFakeTimers();

        const send = vi.mocked(sendAlreadyRegisteredEmail);
        send.mockRejectedValueOnce(new Error("provedor fora"));
        send.mockResolvedValueOnce(undefined);

        enqueueEmail({ kind: "alreadyRegistered", to: "bruno@test.com" });

        await vi.advanceTimersByTimeAsync(6_000);

        expect(send).toHaveBeenCalledTimes(2);
        expect(send).toHaveBeenLastCalledWith("bruno@test.com");
        expect(getEmailQueueLength()).toBe(0);
    });
});
