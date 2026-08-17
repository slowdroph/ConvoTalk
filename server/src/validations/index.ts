import { z } from "zod";

export const objectId = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: "ID inválido.",
});

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(50, "Nome deve ter no máximo 50 caracteres."),
    email: z
      .string()
      .email("Email inválido.")
      .max(100, "Email deve ter no máximo 100 caracteres."),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(128, "Senha deve ter no máximo 128 caracteres."),
    acceptedTerms: z.literal(true, {
      message:
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido."),
    password: z.string().min(1, "Senha é obrigatória."),
  }),
});

export const profileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(50, "Nome deve ter no máximo 50 caracteres."),
    email: z
      .string()
      .email("Email inválido.")
      .max(100, "Email deve ter no máximo 100 caracteres."),
  }),
});

export const passwordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, "Senha atual é obrigatória.")
      .max(128, "Senha deve ter no máximo 128 caracteres."),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres.")
      .max(128, "Nova senha deve ter no máximo 128 caracteres."),
  }),
});

export const accountSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(128, "Senha deve ter no máximo 128 caracteres."),
  }),
});

export const directRoomSchema = z.object({
  body: z.object({
    userId: objectId,
  }),
});

export const deleteRoomParams = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const createGroupRoomSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(50, "Nome deve ter no máximo 50 caracteres."),
    description: z
      .string()
      .trim()
      .max(200, "Descrição deve ter no máximo 200 caracteres.")
      .optional()
      .default(""),
    participantIds: z
      .array(objectId)
      .max(50, "No máximo 50 participantes por grupo.")
      .optional()
      .default([]),
  }),
});

export const updateGroupRoomSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(50, "Nome deve ter no máximo 50 caracteres.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(200, "Descrição deve ter no máximo 200 caracteres.")
      .optional(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    userId: objectId,
  }),
});

export const removeMemberParams = z.object({
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
});

export const addAdminSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    userId: objectId,
  }),
});

export const removeAdminParams = z.object({
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
});

export const messagesQuerySchema = z.object({
  params: z.object({
    roomId: objectId,
  }),
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limite deve ser no mínimo 1.")
      .max(100, "Limite deve ser no máximo 100.")
      .default(50),
    before: z.string().datetime("Data inválida.").optional(),
    beforeId: objectId.optional(),
  }),
});

export const messageSearchQuerySchema = z.object({
  params: z.object({
    roomId: objectId,
  }),
  query: z.object({
    q: z
      .string()
      .min(1, "Termo de busca é obrigatório.")
      .max(100, "Termo de busca deve ter no máximo 100 caracteres."),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limite deve ser no mínimo 1.")
      .max(50, "Limite deve ser no máximo 50.")
      .default(20),
  }),
});

export const searchQuerySchema = z.object({
  query: z.object({
    q: z
      .string()
      .min(1, "Termo de busca é obrigatório.")
      .max(100, "Termo de busca deve ter no máximo 100 caracteres."),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limite deve ser no mínimo 1.")
      .max(50, "Limite deve ser no máximo 50.")
      .default(20),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido.").max(100, "Email deve ter no máximo 100 caracteres."),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido.").max(100, "Email deve ter no máximo 100 caracteres."),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token é obrigatório."),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(128, "Senha deve ter no máximo 128 caracteres."),
  }),
});

export const blockUserParams = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const statusSchema = z.object({
  body: z.object({
    status: z
      .string()
      .trim()
      .max(100, "Status deve ter no máximo 100 caracteres."),
  }),
});

export const linkPreviewSchema = z.object({
  body: z.object({
    url: z
      .string()
      .url("URL inválida.")
      .max(2048, "URL muito longa.")
      .refine((val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      }, "Apenas URLs http/https são permitidas."),
  }),
});
