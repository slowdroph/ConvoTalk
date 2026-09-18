import { Router } from "express";
import crypto from "crypto";
import auth from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/turn-credentials", auth, (_req: AuthRequest, res) => {
    const TURN_URL = process.env.TURN_URL;
    const TURN_USERNAME = process.env.TURN_USERNAME;
    const TURN_SECRET = process.env.TURN_SECRET;

    if (!TURN_URL || !TURN_USERNAME || !TURN_SECRET) {
        res.json({ urls: [], username: "", credential: "", ttl: 0 });
        return;
    }

    const ttl = Math.floor(Date.now() / 1000) + 86400;
    const username = `${ttl}:${TURN_USERNAME}`;
    const hmac = crypto.createHmac("sha1", TURN_SECRET);
    hmac.update(username);
    const credential = hmac.digest("base64");

    res.json({ urls: [TURN_URL], username, credential, ttl });
});

export default router;
