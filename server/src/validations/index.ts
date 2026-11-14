import { z } from "zod";

export const objectId = z
    .string()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
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
        currentPassword: z
            .string()
            .max(128, "Senha deve ter no máximo 128 caracteres.")
            .optional()
            .default(""),
    }),
});

export const locationSchema = z.object({
    body: z.object({
        country: z
            .string()
            .regex(/^[A-Z]{2}$/, "País inválido.")
            .nullable()
            .optional(),
        city: z
            .string()
            .trim()
            .max(80, "Cidade deve ter no máximo 80 caracteres.")
            .nullable()
            .optional(),
    }),
});

export const confirmEmailChangeSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token é obrigatório."),
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
        visibility: z
            .enum(["private", "public"])
            .optional()
            .default("private"),
    }),
});

export const patchVisibilitySchema = z.object({
    params: z.object({
        id: objectId,
    }),
    body: z.object({
        visibility: z.enum(["private", "public"], {
            message: "Visibilidade inválida.",
        }),
    }),
});

export const publicRoomsQuerySchema = z.object({
    query: z.object({
        q: z
            .string()
            .trim()
            .max(100, "Termo de busca deve ter no máximo 100 caracteres.")
            .optional()
            .default(""),
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(50, "Limite deve ser no máximo 50.")
            .default(20),
        before: objectId.optional(),
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
            .max(100, "Termo de busca deve ter no máximo 100 caracteres.")
            .optional()
            .default(""),
        filter: z
            .enum(["all", "mentions"])
            .optional()
            .default("all"),
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(50, "Limite deve ser no máximo 50.")
            .default(20),
    }).refine((data) => {
        if (data.filter === "all" && !data.q.trim()) {
            return false;
        }
        return true;
    }, "Termo de busca é obrigatório quando filtro não é 'mentions'."),
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

// Busca global de mensagens (texto livre, permite @ e 1+ caracteres).
export const messageSearchAllQuerySchema = searchQuerySchema;

export const userSearchQuerySchema = z.object({
    query: z.object({
        q: z
            .string()
            .trim()
            .min(3, "Digite pelo menos 3 caracteres para buscar.")
            .max(50, "Termo de busca deve ter no máximo 50 caracteres.")
            .refine((val) => !val.includes("@"), {
                message:
                    "Busque por nome ou #ID. Busca por email foi desativada.",
            }),
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(50, "Limite deve ser no máximo 50.")
            .default(20),
    }),
});

export const userSuggestionsQuerySchema = z.object({
    query: z.object({
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(12, "Limite deve ser no máximo 12.")
            .default(8),
    }),
});

export const resendVerificationSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Email inválido.")
            .max(100, "Email deve ter no máximo 100 caracteres."),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Email inválido.")
            .max(100, "Email deve ter no máximo 100 caracteres."),
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
                    return (
                        parsed.protocol === "http:" ||
                        parsed.protocol === "https:"
                    );
                } catch {
                    return false;
                }
            }, "Apenas URLs http/https são permitidas."),
    }),
});

export const pushSubscribeSchema = z.object({
    body: z.object({
        endpoint: z.string().url("Endpoint de push inválido."),
        keys: z.object({
            p256dh: z
                .string()
                .regex(/^[A-Za-z0-9_-]+$/, "Chave p256dh inválida.")
                .min(1, "Chave p256dh é obrigatória."),
            auth: z
                .string()
                .regex(/^[A-Za-z0-9_-]+$/, "Chave auth inválida.")
                .min(1, "Chave auth é obrigatória."),
        }),
        userAgent: z.string().max(300).optional(),
    }),
});

export const pushUnsubscribeSchema = z.object({
    body: z.object({
        endpoint: z.string().url("Endpoint de push inválido."),
    }),
});

export const aiSummarizeSchema = z.object({
    params: z.object({
        roomId: objectId,
    }),
    body: z
        .object({
            limit: z.coerce
                .number()
                .int()
                .min(1, "Limite deve ser no mínimo 1.")
                .max(200, "Limite deve ser no máximo 200.")
                .optional(),
            sinceMessageId: objectId.optional(),
            regenerate: z.boolean().optional(),
        })
        .default({}),
});

export const aiSuggestRepliesSchema = z.object({
    params: z.object({
        roomId: objectId,
    }),
    body: z
        .object({
            messageId: objectId.optional(),
            regenerate: z.boolean().optional(),
        })
        .default({}),
});

const postPaginationQuerySchema = z
    .object({
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(30, "Limite deve ser no máximo 30.")
            .default(20),
        before: z.string().datetime("Data inválida.").optional(),
        beforeId: objectId.optional(),
    })
    .refine((data) => !data.before || !!data.beforeId, {
        message: "beforeId é obrigatório quando before é informado.",
        path: ["beforeId"],
    })
    .refine((data) => !data.beforeId || !!data.before, {
        message: "before é obrigatório quando beforeId é informado.",
        path: ["before"],
    });

const postFeedQueryShape = {
    limit: z.coerce
        .number()
        .int()
        .min(1, "Limite deve ser no mínimo 1.")
        .max(30, "Limite deve ser no máximo 30.")
        .default(20),
    filter: z.enum(["all", "media", "mine"]).default("all"),
    sort: z.enum(["recent", "popular"]).default("recent"),
    before: z.string().datetime("Data inválida.").optional(),
    beforeLikes: z.coerce
        .number()
        .int()
        .min(0, "Curtidas inválidas.")
        .optional(),
    beforeId: objectId.optional(),
};

type PostFeedCursorInput = {
    sort: "recent" | "popular";
    before?: string;
    beforeLikes?: number;
    beforeId?: string;
};

function refinePostFeedCursor(
    data: PostFeedCursorInput,
    ctx: z.RefinementCtx,
): void {
    if (data.sort === "popular") {
        if (data.before) {
            ctx.addIssue({
                code: "custom",
                message:
                    "before não é permitido na ordenação por populares.",
                path: ["before"],
            });
        }
        if (data.beforeLikes === undefined && data.beforeId !== undefined) {
            ctx.addIssue({
                code: "custom",
                message:
                    "beforeLikes é obrigatório quando beforeId é informado.",
                path: ["beforeLikes"],
            });
        }
        if (data.beforeLikes !== undefined && data.beforeId === undefined) {
            ctx.addIssue({
                code: "custom",
                message:
                    "beforeId é obrigatório quando beforeLikes é informado.",
                path: ["beforeId"],
            });
        }
        return;
    }

    if (data.beforeLikes !== undefined) {
        ctx.addIssue({
            code: "custom",
            message:
                "beforeLikes só é permitido na ordenação por populares.",
            path: ["beforeLikes"],
        });
    }
    if (data.before && !data.beforeId) {
        ctx.addIssue({
            code: "custom",
            message: "beforeId é obrigatório quando before é informado.",
            path: ["beforeId"],
        });
    }
    if (data.beforeId && !data.before) {
        ctx.addIssue({
            code: "custom",
            message: "before é obrigatório quando beforeId é informado.",
            path: ["before"],
        });
    }
}

export const postFeedQuerySchema =
    z.object(postFeedQueryShape).superRefine(refinePostFeedCursor);

export const postSearchQuerySchema = z
    .object({
        ...postFeedQueryShape,
        q: z
            .string()
            .trim()
            .min(2, "Busque por pelo menos 2 caracteres.")
            .max(100, "Busca deve ter no máximo 100 caracteres."),
    })
    .superRefine(refinePostFeedCursor);

export const postSearchRequestSchema = z.object({
    query: postSearchQuerySchema,
});

export const trendingTopicsQuerySchema = z.object({
    query: z.object({
        limit: z.coerce
            .number()
            .int()
            .min(1, "Limite deve ser no mínimo 1.")
            .max(10, "Limite deve ser no máximo 10.")
            .default(5),
    }),
});

const pollOptionsSchema = z
    .array(
        z
            .string()
            .trim()
            .min(1, "Preencha todas as opções da enquete.")
            .max(100, "Opção deve ter no máximo 100 caracteres."),
    )
    .min(2, "Informe pelo menos 2 opções.")
    .max(4, "Informe no máximo 4 opções.")
    .refine(
        (options) =>
            new Set(options.map((option) => option.toLowerCase())).size ===
            options.length,
        { message: "As opções da enquete não podem se repetir." },
    );

const pollInputSchema = z.object({ options: pollOptionsSchema });

const pollBodySchema = z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
        if (!value) return undefined;

        let parsed: unknown;
        try {
            parsed = JSON.parse(value);
        } catch {
            ctx.addIssue({
                code: "custom",
                message: "Enquete inválida.",
            });
            return z.NEVER;
        }

        const result = pollInputSchema.safeParse(parsed);
        if (!result.success) {
            for (const issue of result.error.issues) {
                ctx.addIssue({
                    code: "custom",
                    message: issue.message,
                    path: ["options", ...issue.path],
                });
            }
            return z.NEVER;
        }

        return result.data;
    });

export const createPostSchema = z.object({
    body: z.object({
        content: z
            .string()
            .trim()
            .max(2000, "Post deve ter no máximo 2000 caracteres.")
            .optional()
            .default(""),
        clientPostId: z
            .string()
            .trim()
            .min(1, "ID do post inválido.")
            .max(64, "ID do post inválido.")
            .optional(),
        poll: pollBodySchema,
    }),
});

export const postsQuerySchema = z.object({
    query: postFeedQuerySchema,
});

export const postsByUserQuerySchema = z.object({
    params: z.object({
        userId: objectId,
    }),
    query: postPaginationQuerySchema,
});

export const savedPostsQuerySchema = z.object({
    query: postPaginationQuerySchema,
});

export const postParamsSchema = z.object({
    params: z.object({
        id: objectId,
    }),
});

export const votePollSchema = z.object({
    params: z.object({
        id: objectId,
    }),
    body: z.object({
        optionId: objectId,
    }),
});

export const commentsQuerySchema = z.object({
    params: z.object({
        id: objectId,
    }),
    query: z
        .object({
            limit: z.coerce
                .number()
                .int()
                .min(1, "Limite deve ser no mínimo 1.")
                .max(30, "Limite deve ser no máximo 30.")
                .default(20),
            before: z.string().datetime("Data inválida.").optional(),
            beforeId: objectId.optional(),
        })
        .superRefine((data, ctx) => {
            if (data.before && !data.beforeId) {
                ctx.addIssue({
                    code: "custom",
                    message: "beforeId é obrigatório quando before é informado.",
                    path: ["beforeId"],
                });
            }
            if (data.beforeId && !data.before) {
                ctx.addIssue({
                    code: "custom",
                    message: "before é obrigatório quando beforeId é informado.",
                    path: ["before"],
                });
            }
        }),
});

export const createCommentSchema = z.object({
    params: z.object({
        id: objectId,
    }),
    body: z.object({
        content: z
            .string()
            .trim()
            .min(1, "Escreva um comentário.")
            .max(500, "Comentário deve ter no máximo 500 caracteres."),
        clientCommentId: z
            .string()
            .trim()
            .min(1, "ID do comentário inválido.")
            .max(64, "ID do comentário inválido.")
            .optional(),
    }),
});

export const commentParamsSchema = z.object({
    params: z.object({
        id: objectId,
        commentId: objectId,
    }),
});

