import {
    DEFAULT_LANGUAGE,
    normalizeLanguage,
    type LanguageCode,
} from "../../../shared/i18n";

interface PushCopy {
    attachment: string;
    mention: (senderName: string) => string;
}

const PUSH_COPY: Record<LanguageCode, PushCopy> = {
    "pt-BR": {
        attachment: "Enviou um anexo",
        mention: (name) => `@${name} mencionou você`,
    },
    en: {
        attachment: "Sent an attachment",
        mention: (name) => `@${name} mentioned you`,
    },
    es: {
        attachment: "Envió un archivo adjunto",
        mention: (name) => `@${name} te mencionó`,
    },
    fr: {
        attachment: "A envoyé une pièce jointe",
        mention: (name) => `@${name} vous a mentionné`,
    },
};

export function getPushCopy(language?: string | null): PushCopy {
    return PUSH_COPY[normalizeLanguage(language)] ?? PUSH_COPY[DEFAULT_LANGUAGE];
}
