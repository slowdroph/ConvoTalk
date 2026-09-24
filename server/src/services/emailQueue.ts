import { logger } from "../config/logger";
import {
    sendVerificationEmail,
    sendAlreadyRegisteredEmail,
    sendPasswordResetEmail,
    sendEmailChangeConfirmation,
} from "./email";

export type EmailJob =
    | {
          kind: "verification";
          to: string;
          name: string;
          token: string;
          attempts: number;
      }
    | {
          kind: "alreadyRegistered";
          to: string;
          attempts: number;
      }
    | {
          kind: "passwordReset";
          to: string;
          name: string;
          token: string;
          attempts: number;
      }
    | {
          kind: "emailChange";
          to: string;
          name: string;
          token: string;
          attempts: number;
      };

export type NewEmailJob =
    | { kind: "verification"; to: string; name: string; token: string }
    | { kind: "alreadyRegistered"; to: string }
    | { kind: "passwordReset"; to: string; name: string; token: string }
    | { kind: "emailChange"; to: string; name: string; token: string };

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [5_000, 30_000, 300_000];

const queue: EmailJob[] = [];
let processing = false;

async function dispatch(job: EmailJob): Promise<void> {
    switch (job.kind) {
        case "verification":
            await sendVerificationEmail(job.to, job.name, job.token);
            return;
        case "alreadyRegistered":
            await sendAlreadyRegisteredEmail(job.to);
            return;
        case "passwordReset":
            await sendPasswordResetEmail(job.to, job.name, job.token);
            return;
        case "emailChange":
            await sendEmailChangeConfirmation(job.to, job.name, job.token);
            return;
    }
}

function scheduleRetry(job: EmailJob): void {
    const delay = RETRY_DELAYS_MS[job.attempts] ?? 300_000;
    const next: EmailJob = { ...job, attempts: job.attempts + 1 };
    setTimeout(() => {
        queue.push(next);
        void processQueue();
    }, delay).unref?.();
}

async function processQueue(): Promise<void> {
    if (processing) return;
    processing = true;
    try {
        while (queue.length > 0) {
            const job = queue.shift()!;
            try {
                await dispatch(job);
            } catch (error) {
                if (job.attempts + 1 >= MAX_ATTEMPTS) {
                    logger.error(
                        { error, kind: job.kind, to: job.to },
                        "desistindo do envio de email após tentativas",
                    );
                } else {
                    logger.warn(
                        { kind: job.kind, to: job.to, attempt: job.attempts + 1 },
                        "falha no envio de email, reagendando",
                    );
                    scheduleRetry(job);
                }
            }
        }
    } finally {
        processing = false;
    }
}

export function enqueueEmail(job: NewEmailJob): void {
    queue.push({ ...job, attempts: 0 } as EmailJob);
    void processQueue();
}

export function getEmailQueueLength(): number {
    return queue.length;
}

export async function flushEmailQueue(timeoutMs = 5_000): Promise<void> {
    const start = Date.now();
    while (queue.length > 0 || processing) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("Timeout aguardando fila de emails.");
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}
