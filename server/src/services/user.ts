import bcrypt from "bcryptjs";
import User from "../models/User";
import Message from "../models/Message";
import Room from "../models/Room";
import Session from "../models/Session";
import PushSubscription from "../models/PushSubscription";
import ReadLog from "../models/ReadLog";
import cloudinary from "../config/cloudinary";
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
    ConflictError,
    ValidationError,
} from "../utils/errors";
import {
    deleteCloudinaryAttachments,
    cloudinaryPublicIdFromUrl,
} from "./cloudinary";
import { sendEmailChangeConfirmation } from "./email";
import {
    generateSecretToken,
    hashSecretToken,
    VERIFICATION_TOKEN_EXPIRES_MIN,
} from "./token";
import { SALT_ROUNDS, PUBLIC_USER_SELECT } from "../constants";
import { logger } from "../config/logger";
import { getSocketIO } from "../config/io";
import { emitForceLogout } from "../utils/socket";
import { escapeRegex } from "../utils/regex";

const SENSITIVE_SELECT =
    "-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -pendingEmailToken -pendingEmailTokenExpiry";

function toSafeUserObject(doc: ReturnType<typeof User.prototype.toObject>) {
    const {
        password: _password,
        verificationToken: _vt,
        verificationTokenExpiry: _vte,
        pendingEmailToken: _pet,
        pendingEmailTokenExpiry: _pete,
        resetToken: _rt,
        resetTokenExpiry: _rte,
        ...safeUser
    } = doc;
    return safeUser;
}

export async function getMe(userId: string) {
    const user = await User.findById(userId).select(SENSITIVE_SELECT).lean();
    if (!user) {
        throw new NotFoundError("Usuário não encontrado.");
    }
    return { ...user, emailPending: Boolean(user.pendingEmail) };
}

export async function getUserStatus(userId: string) {
    const user = await User.findById(userId)
        .select("name lastSeen avatar status")
        .lean();
    if (!user) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    return {
        userId: user._id,
        name: user.name,
        avatar: user.avatar || "",
        status: user.status || "",
        lastSeen: user.lastSeen,
    };
}

export async function updateProfile(
    userId: string,
    input: { name?: string; email?: string; currentPassword?: string },
) {
    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    let emailChanged = false;
    let confirmationToken = "";

    if (input.name && input.name !== user.name) {
        user.name = input.name;
    }

    const normalizedEmail = input.email?.toLowerCase();
    const isPendingEmail =
        normalizedEmail && normalizedEmail === user.pendingEmail;
    if (normalizedEmail && normalizedEmail !== user.email && !isPendingEmail) {
        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: userId },
        });
        if (existingUser) {
            throw new BadRequestError("Email já está em uso.");
        }

        const isMatch = await bcrypt.compare(
            input.currentPassword || "",
            user.password,
        );
        if (!isMatch) {
            throw new UnauthorizedError("Senha atual incorreta.");
        }

        confirmationToken = generateSecretToken();
        user.pendingEmail = normalizedEmail;
        user.pendingEmailToken = hashSecretToken(confirmationToken);
        user.pendingEmailTokenExpiry = new Date(
            Date.now() + VERIFICATION_TOKEN_EXPIRES_MIN * 60 * 1000,
        );
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        emailChanged = true;
    }

    if (user.isModified()) {
        await user.save();
    }

    if (emailChanged) {
        try {
            await sendEmailChangeConfirmation(
                user.pendingEmail!,
                user.name,
                confirmationToken,
            );
        } catch (error) {
            logger.error(
                { error },
                "erro ao enviar email de confirmação de alteração de email",
            );
        }
    }

    return {
        ...toSafeUserObject(user.toObject()),
        emailPending: Boolean(user.pendingEmail),
        emailChanged,
        previousEmail: emailChanged ? user.email : undefined,
        newEmail: emailChanged ? user.pendingEmail : undefined,
    };
}

export async function confirmEmailChange(token: string) {
    const user = await User.findOne({
        pendingEmailToken: hashSecretToken(token),
        pendingEmailTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
        throw new ValidationError("Token inválido ou expirado.");
    }

    if (!user.pendingEmail) {
        throw new ValidationError("Nenhuma alteração de email pendente.");
    }

    const existingUser = await User.findOne({
        email: user.pendingEmail,
        _id: { $ne: user._id },
    });
    if (existingUser) {
        throw new ConflictError("Este email já está em uso por outra conta.");
    }

    const previousEmail = user.email;
    user.email = user.pendingEmail;
    user.verified = true;
    user.pendingEmail = null;
    user.pendingEmailToken = null;
    user.pendingEmailTokenExpiry = null;
    try {
        await user.save();
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "code" in error &&
            (error as { code: number }).code === 11000
        ) {
            throw new ConflictError(
                "Este email já está em uso por outra conta.",
            );
        }
        throw error;
    }

    try {
        await Session.deleteMany({ userId: user._id });
        const io = getSocketIO();
        if (io) {
            await emitForceLogout(io, user._id.toString(), "email_changed");
        }
    } catch (error) {
        logger.error(
            { error },
            "erro ao fazer logout forçado após confirmação de email",
        );
    }

    return { previousEmail, newEmail: user.email };
}

export async function updateStatus(userId: string, status: string) {
    await User.updateOne({ _id: userId }, { status: status.trim() });
    return status.trim();
}

export async function updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
) {
    const user = await User.findById(userId);
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
}

export async function deleteAccount(userId: string, password: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedError("Senha incorreta.");
    }

    const myId = userId;

    const myRooms = await Room.find({ participants: myId })
        .select("_id type")
        .lean();
    const myRoomIds = myRooms.map((r) => r._id);

    const dmIds = myRooms.filter((r) => r.type === "direct").map((r) => r._id);

    if (dmIds.length > 0) {
        const dmMessages = await Message.find({ room: { $in: dmIds } })
            .select("attachments")
            .lean();
        await deleteCloudinaryAttachments(
            dmMessages.flatMap((m) => m.attachments ?? []),
        );
        await Message.deleteMany({ room: { $in: dmIds } });
        await Room.deleteMany({ _id: { $in: dmIds } });
    }

    await Room.updateMany(
        { _id: { $in: myRoomIds }, type: "group" },
        { $pull: { participants: myId, admins: myId } },
    );

    const myMessages = await Message.find({ sender: myId })
        .select("attachments")
        .lean();
    await deleteCloudinaryAttachments(
        myMessages.flatMap((m) => m.attachments ?? []),
    );
    await Message.deleteMany({ sender: myId });

    await Session.deleteMany({ userId: myId });
    await PushSubscription.deleteMany({ user: myId });
    await ReadLog.deleteMany({ userId: myId });

    await User.updateMany(
        { blockedUsers: myId },
        { $pull: { blockedUsers: myId } },
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

    return { email: user.email };
}

export async function updateAvatar(
    userId: string,
    fileBuffer: Buffer,
    mimetype: string,
) {
    const user = await User.findById(userId);
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

    const b64 = Buffer.from(fileBuffer).toString("base64");
    const dataURI = `data:${mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
        folder: "chat_app_profilePhoto",
        transformation: [{ width: 256, height: 256, crop: "fill" }],
    });

    user.avatar = result.secure_url;
    await user.save();

    return toSafeUserObject(user.toObject());
}

export async function removeAvatar(userId: string) {
    const user = await User.findById(userId);
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

    return toSafeUserObject(user.toObject());
}

export async function blockUserService(myId: string, targetId: string) {
    if (targetId === myId.toString()) {
        throw new BadRequestError("Você não pode bloquear a si mesmo.");
    }

    const target = await User.findById(targetId).select("_id").lean();
    if (!target) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    const me = await User.findById(myId).select("blockedUsers").lean();
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
        { _id: myId },
        { $addToSet: { blockedUsers: targetId } },
    );
}

export async function unblockUserService(myId: string, targetId: string) {
    await User.updateOne({ _id: myId }, { $pull: { blockedUsers: targetId } });
}

export async function getBlockedUsers(userId: string) {
    const me = await User.findById(userId)
        .populate("blockedUsers", PUBLIC_USER_SELECT)
        .select("blockedUsers")
        .lean();

    return me?.blockedUsers ?? [];
}

export async function searchUsers(
    query: string,
    currentUserId: string,
    limit = 20,
) {
    const trimmed = query.trim();
    const isIdQuery = trimmed.startsWith("#");
    const cleanQuery = trimmed.replace(/^#/, "");

    const me = await User.findById(currentUserId).select("blockedUsers").lean();

    const blocked = new Set(
        (me?.blockedUsers ?? []).map((id) => id.toString()),
    );

    const orFilters: Record<string, unknown>[] = isIdQuery
        ? [
              {
                  publicId: new RegExp(
                      `^${escapeRegex(cleanQuery.toUpperCase())}`,
                  ),
              },
          ]
        : [
              { name: new RegExp(escapeRegex(trimmed), "i") },
              {
                  publicId: new RegExp(
                      `^${escapeRegex(cleanQuery.toUpperCase())}`,
                  ),
              },
          ];

    const users = await User.find({
        _id: { $ne: currentUserId },
        blockedUsers: { $ne: currentUserId },
        $or: orFilters,
    })
        .select(PUBLIC_USER_SELECT)
        .limit(limit)
        .lean();

    return users.filter((u) => !blocked.has(u._id.toString()));
}
