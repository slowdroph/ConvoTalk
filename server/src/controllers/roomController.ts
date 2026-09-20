import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as roomService from "../services/room";
import { getHttpClientIp } from "../utils/clientIp";
import { audit } from "../utils/audit";
import { handleError } from "../utils/errors";

function getParamId(raw: unknown): string {
    const id = Array.isArray(raw) ? raw[0] : raw;
    return id;
}

export async function listRooms(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const result = await roomService.getRoomsWithMeta(req.user!._id);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar salas.");
    }
}

export async function createDirectRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { room, created } = await roomService.createDirectRoom(
            req.user!._id,
            req.body.userId,
        );
        audit({
            action: "room.create_direct",
            actorId: req.user!._id.toString(),
            targetId: req.body.userId,
            ip: getHttpClientIp(req),
            details: {
                roomId: (
                    room as { _id: { toString(): string } }
                )._id.toString(),
            },
        });
        res.status(created ? 201 : 200).json(room);
    } catch (error) {
        handleError(error, res, "Erro ao criar conversa.");
    }
}

export async function createGroupRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { name, description, participantIds, visibility } = req.body;
        const populated = await roomService.createGroupRoom(
            req.user!._id,
            name,
            description,
            participantIds,
            visibility,
        );
        audit({
            action: "room.create_group",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: {
                roomId: (
                    populated as { _id: { toString(): string } }
                )._id.toString(),
                name,
                memberCount: participantIds.length,
                visibility,
            },
        });
        res.status(201).json(populated);
    } catch (error) {
        handleError(error, res, "Erro ao criar grupo.");
    }
}

export async function updateGroupRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const updates: { name?: string; description?: string } = {};
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.description !== undefined)
            updates.description = req.body.description;

        const updated = await roomService.updateGroupRoom(
            id,
            req.user!._id,
            updates,
        );
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao editar grupo.");
    }
}

export async function addMember(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const { userId: newMemberId } = req.body;

        const updated = await roomService.addMemberToRoom(
            id,
            req.user!._id,
            newMemberId,
        );
        audit({
            action: "room.add_member",
            actorId: req.user!._id.toString(),
            targetId: newMemberId,
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao adicionar membro.");
    }
}

export async function removeMember(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const { userId: removeId } = req.params as unknown as {
            userId: string;
        };

        const updated = await roomService.removeMemberFromRoom(
            id,
            req.user!._id,
            removeId,
        );
        audit({
            action: "room.remove_member",
            actorId: req.user!._id.toString(),
            targetId: removeId,
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao remover membro.");
    }
}

export async function deleteRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const result = await roomService.deleteRoomService(id, req.user!._id);
        audit({
            action: "room.delete",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: { roomId: id, type: result.type },
        });
        res.json({ message: "Conversa excluída com sucesso." });
    } catch (error) {
        handleError(error, res, "Erro ao excluir conversa.");
    }
}

export async function addAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const { userId: newAdminId } = req.body;

        const updated = await roomService.addAdminToRoom(
            id,
            req.user!._id,
            newAdminId,
        );
        audit({
            action: "room.add_admin",
            actorId: req.user!._id.toString(),
            targetId: newAdminId,
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao definir administrador.");
    }
}

export async function removeAdmin(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const { userId: removeAdminId } = req.params as unknown as {
            userId: string;
        };

        const updated = await roomService.removeAdminFromRoom(
            id,
            req.user!._id,
            removeAdminId,
        );
        audit({
            action: "room.remove_admin",
            actorId: req.user!._id.toString(),
            targetId: removeAdminId,
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao remover administrador.");
    }
}

export async function updateGroupVisibility(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const updated = await roomService.updateGroupVisibility(
            id,
            req.user!._id,
            req.body.visibility,
        );
        audit({
            action: "room.update_visibility",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: { roomId: id, visibility: req.body.visibility },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao alterar visibilidade do grupo.");
    }
}

export async function listPublicRooms(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { q, limit, before } = req.query as unknown as {
            q: string;
            limit: number;
            before?: string;
        };
        const result = await roomService.getPublicRooms(
            req.user!._id,
            q,
            limit,
            before,
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar grupos públicos.");
    }
}

export async function joinPublicRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const updated = await roomService.joinPublicRoom(id, req.user!._id);
        audit({
            action: "room.join_public",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao entrar no grupo.");
    }
}

export async function leaveGroupRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const updated = await roomService.leaveGroupRoom(id, req.user!._id);
        audit({
            action: "room.leave",
            actorId: req.user!._id.toString(),
            ip: getHttpClientIp(req),
            details: { roomId: id },
        });
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao sair do grupo.");
    }
}

export async function updateGroupAvatar(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);

        if (!req.file) {
            const { BadRequestError } = await import("../utils/errors");
            throw new BadRequestError("Nenhuma imagem enviada.");
        }

        const updated = await roomService.updateGroupAvatar(
            id,
            req.user!._id,
            req.file.buffer,
            req.file.mimetype,
        );
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao atualizar avatar do grupo.");
    }
}

export async function removeGroupAvatar(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const updated = await roomService.removeGroupAvatarService(
            id,
            req.user!._id,
        );
        res.json(updated);
    } catch (error) {
        handleError(error, res, "Erro ao remover avatar do grupo.");
    }
}

export async function getPinnedMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const id = getParamId(req.params.id);
        const result = await roomService.getPinnedMessages(id, req.user!._id);
        res.json({ pinnedMessages: result });
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens fixadas.");
    }
}
