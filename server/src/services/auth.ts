import bcrypt from "bcryptjs";
import User from "../models/User";
import Session from "../models/Session";
import {
    UnauthorizedError,
    ValidationError,
} from "../utils/errors";
import {
    sendVerificationEmail,
    sendAlreadyRegisteredEmail,
    sendPasswordResetEmail,
} from "./email";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    hashRefreshToken,
    hashSecretToken,
    generateSecretToken,
    VERIFICATION_TOKEN_EXPIRES_MIN,
    RESET_TOKEN_EXPIRES_MIN,
} from "./token";
import { SALT_ROUNDS } from "../constants";
import { logger } from "../config/logger";
import { getSocketIO } from "../config/io";
import { emitForceLogout } from "../utils/socket";
import { generatePublicId } from "../utils/publicId";

function publicUser(user: {
    _id: unknown;
    name: string;
    email: string;
    publicId: string;
    avatar: string;
}): { _id: string; name: string; email: string; publicId: string; avatar: string } {
    return {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        publicId: user.publicId,
        avatar: user.avatar,
    };
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

export async function registerUser(
    input: { name: string; email: string; password: string },
    ip?: string,
) {
    const { name, email, password } = input;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        try {
            await sendAlreadyRegisteredEmail(email);
        } catch (error) {
            logger.error(
                { error },
                "erro ao enviar email de conta já existente no cadastro",
            );
        }
        return { alreadyExists: true as const, emailSendingFailed: false };
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = generateSecretToken();

    let publicId = generatePublicId();
    let user;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            user = await User.create({
                name,
                email,
                publicId,
                password: hashedPassword,
                verificationToken: hashSecretToken(verificationToken),
                verificationTokenExpiry: new Date(
                    Date.now() + VERIFICATION_TOKEN_EXPIRES_MIN * 60 * 1000,
                ),
                lastIp: ip ?? null,
                lastIpAt: new Date(),
            });
            break;
        } catch (err: unknown) {
            if (
                attempt < MAX_RETRIES - 1 &&
                err instanceof Error &&
                "code" in err &&
                (err as { code: number }).code === 11000
            ) {
                publicId = generatePublicId();
                continue;
            }
            throw err;
        }
    }
    if (!user) {
        throw new Error("Não foi possível criar o usuário. Tente novamente.");
    }

    let emailSendingFailed = false;
    try {
        await sendVerificationEmail(email, name, verificationToken);
    } catch (error) {
        logger.error(
            { error },
            "erro ao enviar email de verificação no cadastro",
        );
        emailSendingFailed = true;
    }

    return { alreadyExists: false as const, emailSendingFailed };
}

export async function loginUser(
    email: string,
    password: string,
    userAgent: string,
    ip?: string,
) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new UnauthorizedError("Credenciais inválidas.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedError("Credenciais inválidas.");
    }

    if (!user.verified) {
        return {
            emailNotVerified: true,
            needsVerification: true,
        } as const;
    }

    const deviceType = parseDeviceType(userAgent);
    const deviceLabel = buildDeviceLabel(userAgent);

    const tempRefreshToken = signRefreshToken(user._id.toString(), "pending");
    const session = await Session.create({
        userId: user._id,
        token: hashRefreshToken(tempRefreshToken),
        deviceType,
        userAgent: userAgent.slice(0, 500),
        ip: ip ?? null,
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

    user.lastIp = ip ?? null;
    user.lastIpAt = new Date();
    await user.save();

    return {
        accessToken,
        refreshToken: finalRefreshToken,
        user: publicUser(user),
        sessionId: session._id.toString(),
        deviceType,
    };
}

export async function refreshSession(refreshToken: string, ip?: string) {
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
    if (ip && ip !== "unknown" && session.ip !== ip) {
        session.ip = ip;
    }
    await session.save();

    const accessToken = signAccessToken(userId, sessionId);

    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: publicUser(user),
    };
}

export async function logoutSession(refreshToken: string) {
    try {
        const { sessionId } = verifyRefreshToken(refreshToken);
        if (sessionId) {
            await Session.findByIdAndDelete(sessionId);
        }
    } catch {
        // Token inválido — silently ignore
    }
}

export async function verifyEmailToken(token: string) {
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
}

export async function resendVerification(email: string) {
    const user = await User.findOne({ email });
    if (!user || user.verified) {
        return;
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
}

export async function requestPasswordReset(email: string) {
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
}

export async function resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
        resetToken: hashSecretToken(token),
        resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
        throw new ValidationError("Token inválido ou expirado.");
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    await Session.deleteMany({ userId: user._id });

    const io = getSocketIO();
    if (io) {
        await emitForceLogout(io, user._id.toString(), "password_changed");
    }
}
