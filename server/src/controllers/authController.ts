import { Response, Request } from "express";
import * as authService from "../services/auth";
import {
    audit,
} from "../utils/audit";
import {
    handleError,
} from "../utils/errors";
import {
    refreshCookieOptions,
    REFRESH_COOKIE_NAME,
} from "../services/token";
import { getHttpClientIp } from "../utils/clientIp";

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const {
            name,
            email,
            password,
            gender,
            birthdate,
            country,
            city,
            languages,
            languageLevels,
            language,
        } = req.body;
        const clientIp = getHttpClientIp(req);
        const userAgent = req.header("User-Agent") || "";
        const result = await authService.registerUser(
            {
                name,
                email,
                password,
                gender,
                birthdate,
                country,
                city,
                languages,
                languageLevels,
                language,
            },
            clientIp,
            userAgent,
        );

        if (result.alreadyExists) {
            res.status(201).json({
                message:
                    "Se o email for válido, enviamos um link de confirmação. Verifique sua caixa de entrada.",
            });
            return;
        }

        audit({
            action: "auth.register",
            actorId: result.user._id,
            ip: getHttpClientIp(req),
            details: {
                emailDomain: email.split("@")[1] ?? null,
                acceptedTerms: true,
            },
        });

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        res.status(201).json({
            message: result.emailSendingFailed
                ? "Conta criada, mas não foi possível enviar o email de verificação. Solicite um novo email na tela de verificação."
                : "Conta criada! Enviamos um link de confirmação para o seu email.",
            ...(result.emailSendingFailed
                ? { emailSendingFailed: true }
                : {}),
            token: result.accessToken,
            user: result.user,
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        const userAgent = req.header("User-Agent") || "";
        const clientIp = getHttpClientIp(req);

        const result = await authService.loginUser(
            email,
            password,
            userAgent,
            clientIp,
        );

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        audit({
            action: "auth.login",
            actorId: result.user._id.toString(),
            ip: clientIp,
            details: { email, sessionId: result.sessionId, deviceType: result.deviceType },
        });

        res.json({
            token: result.accessToken,
            user: result.user,
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
            const { UnauthorizedError } = await import("../utils/errors");
            throw new UnauthorizedError("Sessão expirada.");
        }

        const result = await authService.refreshSession(refreshToken, getHttpClientIp(req));
        res.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            refreshCookieOptions(),
        );
        res.json({
            token: result.accessToken,
            user: result.user,
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
        await authService.logoutSession(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.json({ message: "Sessão encerrada." });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const rawToken = req.params.token;
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        await authService.verifyEmailToken(token);
        res.json({
            message: "Email verificado com sucesso! Você já pode continuar no app.",
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
        await authService.resendVerification(email);
        res.json({
            message:
                "Se o email for válido e ainda não confirmado, enviamos um novo link de confirmação.",
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
        await authService.requestPasswordReset(email);
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
        await authService.resetPassword(token, password);
        res.json({
            message: "Senha redefinida com sucesso! Faça login para continuar.",
        });
    } catch (error) {
        handleError(error, res);
    }
}
