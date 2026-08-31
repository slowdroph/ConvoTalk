import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import User from "../models/User";
import PushSubscription from "../models/PushSubscription";
import {
    savePushSubscription,
    removePushSubscription,
    sendPushToUsers,
    getVapidPublicKey,
    configureWebPush,
} from "../services/pushNotification";
import webpush from "web-push";

vi.mock("web-push", () => {
    return {
        default: {
            setVapidDetails: vi.fn(),
            sendNotification: vi.fn(),
            generateVAPIDKeys: vi.fn(() => ({
                publicKey: "test-pub-key",
                privateKey: "test-priv-key",
            })),
        },
    };
});

beforeAll(async () => {
    await startTestDb();
}, 180_000);

afterAll(async () => {
    await stopTestDb();
}, 30_000);

beforeEach(async () => {
    await clearTestDb();
    vi.clearAllMocks();
    process.env.VAPID_PUBLIC_KEY = "test-public-key";
    process.env.VAPID_PRIVATE_KEY = "test-private-key";
    process.env.VAPID_SUBJECT = "mailto:admin@convotalk.com";
    configureWebPush();
});

describe("Push Notification Service", () => {
    it("retorna a chave pública VAPID configurada", () => {
        const key = getVapidPublicKey();
        expect(key).toBe("test-public-key");
    });

    it("salva e atualiza uma inscrição de push", async () => {
        const user = await User.create({
            name: "Alice",
            email: "alice@test.com",
            password: "password123",
        });

        await savePushSubscription(String(user._id), {
            endpoint: "https://push.example.com/sub/123",
            keys: {
                p256dh: "key-p256dh",
                auth: "key-auth",
            },
            userAgent: "TestAgent",
        });

        const sub = await PushSubscription.findOne({
            endpoint: "https://push.example.com/sub/123",
        });

        expect(sub).not.toBeNull();
        expect(String(sub?.user)).toBe(String(user._id));
        expect(sub?.keys.p256dh).toBe("key-p256dh");

        // Atualização idempotente
        await savePushSubscription(String(user._id), {
            endpoint: "https://push.example.com/sub/123",
            keys: {
                p256dh: "key-p256dh-updated",
                auth: "key-auth",
            },
            userAgent: "TestAgentUpdated",
        });

        const count = await PushSubscription.countDocuments({
            endpoint: "https://push.example.com/sub/123",
        });
        expect(count).toBe(1);

        const updated = await PushSubscription.findOne({
            endpoint: "https://push.example.com/sub/123",
        });
        expect(updated?.keys.p256dh).toBe("key-p256dh-updated");
    });

    it("remove uma inscrição de push", async () => {
        const user = await User.create({
            name: "Bob",
            email: "bob@test.com",
            password: "password123",
        });

        await savePushSubscription(String(user._id), {
            endpoint: "https://push.example.com/sub/bob",
            keys: { p256dh: "k1", auth: "k2" },
        });

        await removePushSubscription(
            String(user._id),
            "https://push.example.com/sub/bob",
        );

        const found = await PushSubscription.findOne({
            endpoint: "https://push.example.com/sub/bob",
        });
        expect(found).toBeNull();
    });

    it("envia notificações push para usuários inscritos", async () => {
        const user = await User.create({
            name: "Carol",
            email: "carol@test.com",
            password: "password123",
        });

        await savePushSubscription(String(user._id), {
            endpoint: "https://push.example.com/sub/carol",
            keys: { p256dh: "k1", auth: "k2" },
        });

        (webpush.sendNotification as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

        await sendPushToUsers([String(user._id)], {
            title: "Nova mensagem",
            body: "Olá Carol",
            data: { roomId: "room123" },
        });

        expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    });

    it("remove automaticamente inscrições expiradas (410 Gone / 404)", async () => {
        const user = await User.create({
            name: "David",
            email: "david@test.com",
            password: "password123",
        });

        await savePushSubscription(String(user._id), {
            endpoint: "https://push.example.com/sub/expired",
            keys: { p256dh: "k1", auth: "k2" },
        });

        const error410 = new Error("Subscription gone");
        (error410 as { statusCode?: number }).statusCode = 410;

        (webpush.sendNotification as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error410);

        await sendPushToUsers([String(user._id)], {
            title: "Mensagem",
            body: "Teste",
        });

        const found = await PushSubscription.findOne({
            endpoint: "https://push.example.com/sub/expired",
        });
        expect(found).toBeNull();
    });
});
