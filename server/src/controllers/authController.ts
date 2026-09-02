import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Session from "../models/Session";
import { Request } from "express";
import {
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
    handleError,
    sendError,
} from "../utils/errors";
import { audit } from "../utils/audit";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../services/email";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    hashRefreshToken,
    hashSecretToken,
    generateSecretToken,
    refreshCookieOptions,
    REFRESH_COOKIE_NAME,
    VERIFICATION_TOKEN_EXPIRES_MIN,
    RESET_TOKEN_EXPIRES_MIN,
} from "../services/token";
import { SALT_ROUNDS } from "../constants";
import { logger } from "../config/logger";
import { getSocketIO } from "../config/io";
import { emitForceLogout } from "../utils/socket";

function publicUser(user: {
    _id: unknown;
    name: string;
    email: string;
    avatar: string;
}): { _id: unknown; name: string; email: string; avatar: string } {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
    };
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ConflictError("Email já cadastrado.");
        }

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = generateSecretToken();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            verificationToken: hashSecretToken(verificationToken),
            verificationTokenExpiry: new Date(
                Date.now() + VERIFICATION_TOKEN_EXPIRES_MIN * 60 * 1000,
            ),
            lastIp: req.ip ?? null,
            lastIpAt: new Date(),
        });

        try {
            await sendVerificationEmail(email, name, verificationToken);
        } catch (error) {
            logger.error(
                { error },
                "erro ao enviar email de verificação no cadastro",
            );
            res.status(201).json({
                message:
                    "Conta criada, mas não foi possível enviar o email de verificação. Solicite um novo email na tela de login.",
                emailSendingFailed: true,
            });
            return;
        }

        audit({
            action: "auth.register",
            actorId: user._id.toString(),
            ip: req.ip,
            details: { email: user.email, acceptedTerms: true },
        });

        res.status(201).json({
            message:
                "Conta criada com sucesso! Enviamos um email de verificação. Verifique sua caixa de entrada.",
        });
    } catch (error) {
        handleError(error, res);
    }
}

function parseDeviceType(userAgent: string): "web" | "mobile" | "desktop" | "unknown" {
    if (!userAgent) return "unknown";
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad/.test(ua)) return "mobile";
    if (/electron/.test(ua)) return "desktop";
    return "web";
}

function buildDeviceLabel(userAgent: string): string {
    if (!userAgent) return "Dispositivo desconhecido";
    const ua = userAgent;
    let browser = "Navegador desconhecido";
    let os = "Sistema desconhecido";

    if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = "Chrome";
    else if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/edge/i.test(ua)) browser = "Edge";
    else if (/opr|opera/i.test(ua)) browser = "Opera";

    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os/i.test(ua)) os = "Mac";
    else if (/linux/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad/i.test(ua)) os = "iOS";

    return `${browser} em ${os}`;
}

const MAX_SESSIONS_PER_USER = 10;

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            throw new UnauthorizedError("Credenciais inválidas.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Credenciais inválidas.");
        }

        if (!user.verified) {
            sendError(
                res,
                403,
                "EMAIL_NOT_VERIFIED",
                "Verifique seu email antes de fazer login. Se não recebeu o email, solicite um novo.",
                { needsVerification: true },
            );
            return;
        }

        const userAgent = req.header("User-Agent") || "";
        const deviceType = parseDeviceType(userAgent);
        const deviceLabel = buildDeviceLabel(userAgent);
        const ip = req.ip ?? null;

        const tempRefreshToken = signRefreshToken(user._id.toString(), "pending");
        const session = await Session.create({
            userId: user._id,
            token: hashRefreshToken(tempRefreshToken),
            deviceType,
            userAgent: userAgent.slice(0, 500),
            ip,
            deviceLabel,
            lastActiveAt: new Date(),
        });

        const accessToken = signAccessToken(user._id.toString(), session._id.toString());
        const finalRefreshToken = signRefreshToken(user._id.toString(), session._id.toString());
        session.token = hashRefreshToken(finalRefreshToken);
        await session.save();

        const excessCount = await Session.countDocuments({ userId: user._id }) - MAX_SESSIONS_PER_USER;
        if (excessCount > 0) {
            const oldestSessions = await Session.find({ userId: user._id })
                .sort({ createdAt: 1 })
                .limit(excessCount)
                .select("_id")
                .lean();
            if (oldestSessions.length > 0) {
                const idsToRemove = oldestSessions.map((s) => s._id);
                await Session.deleteMany({ _id: { $in: idsToRemove } });
            }
        }

        user.lastIp = req.ip ?? null;
        user.lastIpAt = new Date();
        await user.save();

        res.cookie(REFRESH_COOKIE_NAME, finalRefreshToken, refreshCookieOptions());

        audit({
            action: "auth.login",
            actorId: user._id.toString(),
            ip: req.ip,
            details: { email: user.email, sessionId: session._id.toString(), deviceType },
        });

        res.json({
            token: accessToken,
            user: publicUser(user),
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function refresh(req: Request, res: Response): Promise<void> {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
            | string
            | undefined;
        if (!refreshToken) {
            throw new UnauthorizedError("Sessão expirada.");
        }

        const { userId, sessionId } = verifyRefreshToken(refreshToken);
        const user = await User.findById(userId);
        if (!user) {
            throw new UnauthorizedError("Sessão expirada.");
        }

        if (!sessionId) {
            throw new UnauthorizedError("Sessão legada. Faça login novamente.");
        }

        const session = await Session.findById(sessionId);
        if (!session || session.token !== hashRefreshToken(refreshToken)) {
            throw new UnauthorizedError("Sessão expirada.");
        }

        const newRefreshToken = signRefreshToken(userId, sessionId);
        session.token = hashRefreshToken(newRefreshToken);
        session.lastActiveAt = new Date();
        await session.save();

        const accessToken = signAccessToken(userId, sessionId);
        res.cookie(
            REFRESH_COOKIE_NAME,
            newRefreshToken,
            refreshCookieOptions(),
        );
        res.json({
            token: accessToken,
            user: publicUser(user),
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
        | string
        | undefined;
    if (refreshToken) {
        try {
            const { userId, sessionId } = verifyRefreshToken(refreshToken);
            if (sessionId) {
                const io = getSocketIO();
                if (io) {
                    await emitForceLogout(io, userId, "remote_logout", sessionId);
                }
                await Session.findByIdAndDelete(sessionId);
            }
        } catch {
            // Token inválido — apenas limpa o cookie
        }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.json({ message: "Sessão encerrada." });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const rawToken = req.params.token;
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

        const user = await User.findOne({
            verificationToken: hashSecretToken(token),
            verificationTokenExpiry: { $gt: new Date() },
        });
        if (!user) {
            throw new ValidationError("Token inválido ou expirado.");
        }

        user.verified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        await user.save();

        res.json({
            message: "Email verificado com sucesso! Faça login para continuar.",
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function resendVerification(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            throw new NotFoundError("Nenhuma conta encontrada com este email.");
        }

        if (user.verified) {
            throw new ValidationError(
                "Este email já foi verificado. Faça login.",
            );
        }

        const verificationToken = generateSecretToken();
        user.verificationToken = hashSecretToken(verificationToken);
        user.verificationTokenExpiry = new Date(
            Date.now() + VERIFICATION_TOKEN_EXPIRES_MIN * 60 * 1000,
        );
        await user.save();

        try {
            await sendVerificationEmail(
                user.email,
                user.name,
                verificationToken,
            );
        } catch (error) {
            logger.error({ error }, "erro ao reenviar email de verificação");
            throw new Error("Não foi possível enviar o email de verificação.");
        }

        res.json({
            message:
                "Email de verificação reenviado! Verifique sua caixa de entrada.",
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function forgotPassword(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (user) {
            const resetToken = generateSecretToken();
            user.resetToken = hashSecretToken(resetToken);
            user.resetTokenExpiry = new Date(
                Date.now() + RESET_TOKEN_EXPIRES_MIN * 60 * 1000,
            );
            await user.save();

            try {
                await sendPasswordResetEmail(user.email, user.name, resetToken);
            } catch (error) {
                logger.error(
                    { error },
                    "erro ao enviar email de redefinição de senha",
                );
            }
        }

        res.json({
            message:
                "Se existir uma conta com este email, enviaremos um link de redefinição de senha.",
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function resetPassword(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            resetToken: hashSecretToken(token),
            resetTokenExpiry: { $gt: new Date() },
        });
        if (!user) {
            throw new ValidationError("Token inválido ou expirado.");
        }

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        user.password = await bcrypt.hash(password, salt);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        await Session.deleteMany({ userId: user._id });

        const io = getSocketIO();
        if (io) {
            await emitForceLogout(io, user._id.toString(), "password_changed");
        }

        res.json({
            message: "Senha redefinida com sucesso! Faça login para continuar.",
        });
    } catch (error) {
        handleError(error, res);
    }
}
