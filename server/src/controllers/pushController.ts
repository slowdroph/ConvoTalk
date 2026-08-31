import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
    getVapidPublicKey,
    savePushSubscription,
    removePushSubscription,
} from "../services/pushNotification";
import { handleError } from "../utils/errors";

export async function getVapidPublicKeyHandler(
    _req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const publicKey = getVapidPublicKey();
        res.json({ publicKey });
    } catch (error) {
        handleError(error, res, "Erro ao obter chave pública VAPID.");
    }
}

export async function subscribe(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user!._id;
        const { endpoint, keys, userAgent } = req.body;

        await savePushSubscription(userId, {
            endpoint,
            keys,
            userAgent,
        });

        res.status(201).json({
            success: true,
            message: "Inscrição de push registrada com sucesso.",
        });
    } catch (error) {
        handleError(error, res, "Erro ao salvar inscrição de push.");
    }
}

export async function unsubscribe(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user!._id;
        const { endpoint } = req.body;

        await removePushSubscription(userId, endpoint);

        res.json({
            success: true,
            message: "Inscrição de push removida com sucesso.",
        });
    } catch (error) {
        handleError(error, res, "Erro ao remover inscrição de push.");
    }
}
