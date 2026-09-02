import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/auth";
import { objectId } from "../validations";
import cloudinary from "../config/cloudinary";
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
    ConflictError,
    handleError,
} from "../utils/errors";
import { audit } from "../utils/audit";
import {
    deleteCloudinaryAttachments,
    cloudinaryPublicIdFromUrl,
} from "../services/cloudinary";
import { sendVerificationEmail } from "../services/email";
import {
    generateSecretToken,
    hashSecretToken,
    VERIFICATION_TOKEN_EXPIRES_MIN,
} from "../services/token";
import { SALT_ROUNDS } from "../constants";

const SENSITIVE_SELECT =
    "-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -refreshToken";

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const user = await User.findById(req.user!._id)
            .select(SENSITIVE_SELECT)
            .lean();
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }
        res.json(user);
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

        const user = await User.findById(parsed.data)
            .select("name lastSeen avatar status")
            .lean();
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        res.json({
            userId: user._id,
            name: user.name,
            avatar: user.avatar || "",
            status: user.status || "",
            lastSeen: user.lastSeen,
        });
    } catch (error) {
        handleError(error, res, "Erro ao buscar status.");
    }
}

export async function updateProfile(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user!._id);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({
                email,
                _id: { $ne: req.user!._id },
            });
            if (existingUser) {
                throw new BadRequestError("Email já está em uso.");
            }

            user.email = email;
            user.verified = false;
            const verificationToken = generateSecretToken();
            user.verificationToken = hashSecretToken(verificationToken);
            user.verificationTokenExpiry = new Date(
                Date.now() + VERIFICATION_TOKEN_EXPIRES_MIN * 60 * 1000,
            );
            await user.save();

            await sendVerificationEmail(
                user.email,
                user.name,
                verificationToken,
            );
        } else if (name && name !== user.name) {
            user.name = name;
            await user.save();
        }

        const { password: _, ...safeUser } = user.toObject();
        res.json(safeUser);
    } catch (error) {
        handleError(error, res, "Erro ao atualizar perfil.");
    }
}

export async function updateStatus(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { status } = req.body;

        await User.updateOne({ _id: req.user!._id }, { status: status.trim() });

        res.json({ status: status.trim() });
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

        const user = await User.findById(req.user!._id);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Senha atual incorreta.");
        }

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        audit({
            action: "user.update_password",
            actorId: req.user!._id.toString(),
            ip: req.ip,
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

        const user = await User.findById(req.user!._id);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Senha incorreta.");
        }

        const myId = req.user!._id;

        const myMessages = await Message.find({ sender: myId })
            .select("attachments")
            .lean();
        await deleteCloudinaryAttachments(
            myMessages.flatMap((m) => m.attachments ?? []),
        );

        await Message.updateMany(
            { sender: myId },
            { $set: { deleted: true }, $unset: { attachments: 1 } },
        );

        if (user.avatar) {
            const publicId = cloudinaryPublicIdFromUrl(
                user.avatar,
                "chat_app_profilePhoto",
            );
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        await User.findByIdAndDelete(myId);

        audit({
            action: "user.delete_account",
            actorId: myId.toString(),
            ip: req.ip,
            details: { email: user.email },
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
            throw new BadRequestError("Nenhum arquivo enviado.");
        }

        const user = await User.findById(req.user!._id);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        if (user.avatar) {
            const publicId = cloudinaryPublicIdFromUrl(
                user.avatar,
                "chat_app_profilePhoto",
            );
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "chat_app_profilePhoto",
            transformation: [{ width: 256, height: 256, crop: "fill" }],
        });

        user.avatar = result.secure_url;
        await user.save();

        const {
            password: _,
            verificationToken,
            verificationTokenExpiry,
            resetToken,
            resetTokenExpiry,
            ...userWithoutSensitive
        } = user.toObject();
        res.json(userWithoutSensitive);
    } catch (error) {
        handleError(error, res, "Erro ao fazer upload da imagem.");
    }
}

export async function removeAvatar(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const user = await User.findById(req.user!._id);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        if (!user.avatar) {
            throw new BadRequestError("Nenhum avatar para remover.");
        }

        const publicId = cloudinaryPublicIdFromUrl(
            user.avatar,
            "chat_app_profilePhoto",
        );
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        user.avatar = "";
        await user.save();

        const {
            password: _,
            verificationToken,
            verificationTokenExpiry,
            resetToken,
            resetTokenExpiry,
            ...userWithoutSensitive
        } = user.toObject();
        res.json(userWithoutSensitive);
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
        const targetId = parsed.data;

        if (targetId === req.user!._id.toString()) {
            throw new BadRequestError("Você não pode bloquear a si mesmo.");
        }

        const target = await User.findById(targetId).select("_id").lean();
        if (!target) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        const me = await User.findById(req.user!._id)
            .select("blockedUsers")
            .lean();
        if (!me) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        const alreadyBlocked = (me.blockedUsers ?? []).some(
            (id) => id.toString() === targetId,
        );
        if (alreadyBlocked) {
            throw new ConflictError("Usuário já está bloqueado.");
        }

        await User.updateOne(
            { _id: req.user!._id },
            { $addToSet: { blockedUsers: targetId } },
        );

        audit({
            action: "user.block",
            actorId: req.user!._id.toString(),
            targetId,
            ip: req.ip,
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

        await User.updateOne(
            { _id: req.user!._id },
            { $pull: { blockedUsers: parsed.data } },
        );

        audit({
            action: "user.unblock",
            actorId: req.user!._id.toString(),
            targetId: parsed.data,
            ip: req.ip,
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
        const me = await User.findById(req.user!._id)
            .populate("blockedUsers", "name email avatar")
            .select("blockedUsers")
            .lean();

        res.json({ blockedUsers: me?.blockedUsers ?? [] });
    } catch (error) {
        handleError(error, res, "Erro ao buscar usuários bloqueados.");
    }
}
