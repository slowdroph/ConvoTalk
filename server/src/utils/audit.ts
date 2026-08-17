import { logger } from "../config/logger";

export type AuditAction =
    | "auth.register"
    | "auth.login"
    | "auth.logout"
    | "auth.forgot_password"
    | "auth.reset_password"
    | "auth.resend_verification"
    | "auth.verify_email"
    | "user.update_profile"
    | "user.update_password"
    | "user.update_status"
    | "user.delete_account"
    | "user.block"
    | "user.unblock"
    | "user.upload_avatar"
    | "user.remove_avatar"
    | "room.create_direct"
    | "room.create_group"
    | "room.delete"
    | "room.update"
    | "room.add_member"
    | "room.remove_member"
    | "room.add_admin"
    | "room.remove_admin"
    | "message.pin"
    | "message.unpin"
    | "message.delete";

interface AuditContext {
    action: AuditAction;
    actorId?: string;
    targetId?: string;
    ip?: string;
    details?: Record<string, unknown>;
}

export function audit({
    action,
    actorId,
    targetId,
    ip,
    details,
}: AuditContext): void {
    logger.info(
        {
            audit: true,
            action,
            actorId,
            targetId,
            ip,
            details,
        },
        "audit event",
    );
}
