import cloudinary from "../config/cloudinary";
import type { IAttachment } from "../types";
import { logger } from "../config/logger";

const ATTACHMENTS_FOLDER = "chat_app_attachments";

export function cloudinaryPublicIdFromUrl(
  url: string,
  folder: string,
): string | null {
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split("/");
    const last = pathSegments[pathSegments.length - 1];
    if (!last) return null;
    const fileName = last.split(".")[0];
    return fileName ? `${folder}/${fileName}` : null;
  } catch {
    return null;
  }
}

function derivePublicIdFromUrl(url: string): string | null {
  return cloudinaryPublicIdFromUrl(url, ATTACHMENTS_FOLDER);
}

export async function deleteCloudinaryAttachments(
  attachments: IAttachment[] | undefined,
): Promise<void> {
  if (!attachments || attachments.length === 0) return;

  for (const attachment of attachments) {
    const publicId = attachment.publicId || derivePublicIdFromUrl(attachment.url);
    if (!publicId) continue;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error({ publicId, error }, "erro ao remover anexo do Cloudinary");
    }
  }
}