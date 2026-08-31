import webpush from "web-push";
import PushSubscription from "../models/PushSubscription";
import { logger } from "../config/logger";
import type { PushNotificationPayload, PushSubscriptionPayload } from "../../../shared/types";

let isVapidConfigured = false;

export function configureWebPush(): boolean {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@convotalk.com";

    if (publicKey && privateKey) {
        try {
            webpush.setVapidDetails(subject, publicKey, privateKey);
            isVapidConfigured = true;
            logger.info("WebPush VAPID configurado com sucesso.");
            return true;
        } catch (error) {
            logger.error({ error }, "Erro ao configurar chaves VAPID do WebPush.");
            isVapidConfigured = false;
            return false;
        }
    } else {
        isVapidConfigured = false;
        return false;
    }
}

export function getVapidPublicKey(): string | null {
    if (!isVapidConfigured) {
        configureWebPush();
    }
    return isVapidConfigured ? process.env.VAPID_PUBLIC_KEY || null : null;
}

export async function savePushSubscription(
    userId: string,
    sub: PushSubscriptionPayload,
): Promise<void> {
    await PushSubscription.findOneAndUpdate(
        { endpoint: sub.endpoint },
        {
            user: userId,
            endpoint: sub.endpoint,
            keys: sub.keys,
            userAgent: sub.userAgent || "",
            createdAt: new Date(),
        },
        { upsert: true, returnDocument: "after" },

    );
}

export async function removePushSubscription(
    userId: string,
    endpoint: string,
): Promise<void> {
    await PushSubscription.deleteOne({
        user: userId,
        endpoint,
    });
}

export async function sendPushToUsers(
    userIds: string[],
    payload: PushNotificationPayload,
): Promise<void> {
    if (!isVapidConfigured) {
        const configured = configureWebPush();
        if (!configured) return;
    }

    if (!userIds || userIds.length === 0) return;

    try {
        const subscriptions = await PushSubscription.find({
            user: { $in: userIds },
        }).lean();

        if (subscriptions.length === 0) return;

        const stringifiedPayload = JSON.stringify(payload);

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth,
                    },
                };

                try {
                    await webpush.sendNotification(
                        pushConfig,
                        stringifiedPayload,
                    );
                } catch (err: unknown) {
                    const statusCode =
                        err && typeof err === "object" && "statusCode" in err
                            ? (err as { statusCode: number }).statusCode
                            : null;

                    // 404 Not Found ou 410 Gone indicam inscrição expirada/removida pelo browser
                    if (statusCode === 404 || statusCode === 410) {
                        logger.info(
                            { endpoint: sub.endpoint, statusCode },
                            "Inscrição de push expirada. Removendo do banco de dados.",
                        );
                        await PushSubscription.deleteOne({ _id: sub._id }).catch(
                            () => {},
                        );
                    } else {
                        logger.warn(
                            { err, endpoint: sub.endpoint },
                            "Falha ao enviar notificação push.",
                        );
                    }
                }
            }),
        );
    } catch (error) {
        logger.error({ error, userIds }, "Erro no serviço de push notification.");
    }
}
