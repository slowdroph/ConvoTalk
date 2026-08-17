import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { fetchLinkPreview } from "../services/linkPreview";
import { isPrivateHostname } from "../utils/ssrf";
import { logger } from "../config/logger";
import { sendError } from "../utils/errors";

export async function previewLink(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    const { url } = req.body as { url: string };

    try {
        let hostname: string;
        try {
            hostname = new URL(url).hostname;
        } catch {
            sendError(res, 400, "INVALID_URL", "URL inválida.");
            return;
        }

        if (await isPrivateHostname(hostname)) {
            sendError(res, 400, "BLOCKED_HOST", "O domínio informado não é permitido.");
            return;
        }

        const preview = await fetchLinkPreview(url);
        res.json(preview);
    } catch (error) {
        logger.warn(
            { url, err: (error as Error).message },
            "falha ao gerar preview de link",
        );
        sendError(res, 422, "PREVIEW_UNAVAILABLE", "Não foi possível obter o preview deste link.");
    }
}
