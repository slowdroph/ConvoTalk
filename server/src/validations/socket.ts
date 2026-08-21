import { z } from "zod";
import { objectId } from "./index";

export { objectId };

export const socketMessageSchema = z.object({
  roomId: objectId,
  clientMessageId: z.string().trim().min(1).max(64).optional(),
  content: z
    .string()
    .trim()
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres.")
    .optional()
    .default(""),
  attachments: z
    .array(
      z.object({
        url: z.string().url("URL inválida."),
        publicId: z.string().trim().min(1),
        filename: z.string().trim().min(1).max(255),
        mimetype: z.string().trim().min(1).max(100),
        size: z.number().int().min(0).max(10 * 1024 * 1024),
      }),
    )
    .max(5, "No máximo 5 anexos por mensagem.")
    .optional()
    .default([]),
}).refine(
  (data) => data.content.length > 0 || (data.attachments?.length ?? 0) > 0,
  { message: "Mensagem vazia." },
);

export const socketReplySchema = z.object({
  roomId: objectId,
  parentId: objectId,
  clientMessageId: z.string().trim().min(1).max(64).optional(),
  content: z
    .string()
    .trim()
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres.")
    .optional()
    .default(""),
  attachments: z
    .array(
      z.object({
        url: z.string().url("URL inválida."),
        publicId: z.string().trim().min(1),
        filename: z.string().trim().min(1).max(255),
        mimetype: z.string().trim().min(1).max(100),
        size: z.number().int().min(0).max(10 * 1024 * 1024),
      }),
    )
    .max(5, "No máximo 5 anexos por mensagem.")
    .optional()
    .default([]),
}).refine(
  (data) => data.content.length > 0 || (data.attachments?.length ?? 0) > 0,
  { message: "Mensagem vazia." },
);

export const socketTypingSchema = z.object({
  roomId: objectId,
  isTyping: z.boolean(),
});

export const socketDeleteMessageSchema = z.object({
  messageId: objectId,
  roomId: objectId,
  forMe: z.boolean().optional(),
});

export const socketEditMessageSchema = z.object({
  messageId: objectId,
  roomId: objectId,
  content: z
    .string()
    .trim()
    .min(1, "Mensagem vazia.")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres."),
});

export const socketReactionSchema = z.object({
  messageId: objectId,
  roomId: objectId,
  emoji: z
    .string()
    .min(1, "Emoji é obrigatório.")
    .max(16, "Emoji inválido."),
});

export const socketReadSchema = z.object({
  messageId: objectId,
  roomId: objectId,
});

export const socketReadManySchema = z.object({
  roomId: objectId,
  messageIds: z.array(objectId).max(200, "Muitas mensagens."),
});

export const socketPinMessageSchema = z.object({
  roomId: objectId,
  messageId: objectId,
});

export const socketCallInitiateSchema = z.object({
  roomId: objectId,
  calleeId: objectId,
  callType: z.enum(["audio", "video"]),
});

export const socketCallRespondSchema = z.object({
  callId: z.string().trim().min(1).max(64),
  calleeId: objectId,
});

export const socketCallEndSchema = z.object({
  callId: z.string().trim().min(1).max(64),
});

export const socketWebRtcSignalSchema = z.object({
  callId: z.string().trim().min(1).max(64),
  targetId: objectId,
  payload: z.unknown(),
});

export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const first = result.error.issues[0];
  return {
    success: false,
    error: first?.message || "Dados inválidos.",
  };
}
