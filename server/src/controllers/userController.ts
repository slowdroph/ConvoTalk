import { Response, Request } from "express";
import { AuthRequest } from "../middleware/auth";
import { objectId } from "../validations";
import * as userService from "../services/user";
import { getHttpClientIp } from "../utils/clientIp";
import { audit } from "../utils/audit";
import { ValidationError, handleError } from "../utils/errors";

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const result = await userService.getMe(req.user!._id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar usuário.");
    }
}

export async function getUserStatus(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const parsed = objectId.safeParse(req.params.id);
        if (!parsed.success) {
            throw new ValidationError("ID inválido.");
        }
        const result = await userService.getUserStatus(parsed.data);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar status.");
    }
}

export async function updateProfile(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { name, email, currentPassword } = req.body;
        const result = await userService.updateProfile(
            req.user!._id,
            { name, email, currentPassword },
        );
        if (result.emailChanged) {
            audit({
                action: "user.request_email_change",
                actorId: req.user!._id.toString(),
                ip: getHttpClientIp(req),
                details: { previousEmail: result.previousEmail, newEmail: result.newEmail },
            });
        }
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao atualizar perfil.");
    }
}

export async function confirmEmailChange(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { token } = req.body;
        const result = await userService.confirmEmailChange(token);
        audit({
            action: "user.confirm_email_change",
            actorId: result.previousEmail,
            ip: getHttpClientIp(req),
            details: { previousEmail: result.previousEmail, newEmail: result.newEmail },
        });
        res.json({
            message:
                "Email atualizado com sucesso! Faça login para continuar.",
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function updateStatus(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { status } = req.body;
        const result = await userService.updateStatus(req.user!._id, status);
        res.json({ status: result });
    } catch (error) {
        handleError(error, res, "Erro ao atualizar status.");
    }
}

export async function updatePassword(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.updatePassword(
            req.user!._id,
            currentPassword,
            newPassword,
        );
        audit({
            action: "user.update_password",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
        });
        res.json({ message: "Senha alterada com sucesso." });
    } catch (error) {
        handleError(error, res, "Erro ao alterar senha.");
    }
}

export async function deleteAccount(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { password } = req.body;
        const result = await userService.deleteAccount(req.user!._id, password);
        audit({
            action: "user.delete_account",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: { email: result.email },
        });
        res.json({ message: "Conta excluída com sucesso." });
    } catch (error) {
        handleError(error, res, "Erro ao excluir conta.");
    }
}

export async function updateAvatar(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        if (!req.file) {
            const { BadRequestError } = await import("../utils/errors");
            throw new BadRequestError("Nenhum arquivo enviado.");
        }
        const result = await userService.updateAvatar(
            req.user!._id,
            req.file.buffer,
            req.file.mimetype,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao fazer upload da imagem.");
    }
}

export async function removeAvatar(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const result = await userService.removeAvatar(req.user!._id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao remover avatar.");
    }
}

export async function blockUser(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const parsed = objectId.safeParse(req.params.id);
        if (!parsed.success) {
            throw new ValidationError("ID inválido.");
        }
        await userService.blockUserService(req.user!._id, parsed.data);
        audit({
            action: "user.block",
            actorId: req.user!._id.toString(),
            targetId: parsed.data,
            ip: getHttpClientIp(req),
        });
        res.json({ blocked: true });
    } catch (error) {
        handleError(error, res, "Erro ao bloquear usuário.");
    }
}

export async function unblockUser(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const parsed = objectId.safeParse(req.params.id);
        if (!parsed.success) {
            throw new ValidationError("ID inválido.");
        }
        await userService.unblockUserService(req.user!._id, parsed.data);
        audit({
            action: "user.unblock",
            actorId: req.user!._id.toString(),
            targetId: parsed.data,
            ip: getHttpClientIp(req),
        });
        res.json({ blocked: false });
    } catch (error) {
        handleError(error, res, "Erro ao desbloquear usuário.");
    }
}

export async function listBlockedUsers(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const blockedUsers = await userService.getBlockedUsers(req.user!._id);
        res.json({ blockedUsers });
    } catch (error) {
        handleError(error, res, "Erro ao buscar usuários bloqueados.");
    }
}
