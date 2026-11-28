import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";
import { MAX_INTERESTS, isInterestId } from "../../../shared/interests";
import {
    MAX_LANGUAGES,
    isGenderId,
    isLanguageId,
    isLanguageLevelId,
} from "../../../shared/profile";
import { SUPPORTED_LANGUAGES } from "../../../shared/i18n";

const preferencesSchema = new Schema(
    {
        language: {
            type: String,
            enum: [...SUPPORTED_LANGUAGES],
        },
    },
    { _id: false },
);

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 8,
        maxlength: 8,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    avatar: {
        type: String,
        default: "",
    },
    verified: {
        type: Boolean,
        default: false,
    },
    messageQuotaDate: {
        type: String,
        default: null,
    },
    messageQuotaUsed: {
        type: Number,
        default: 0,
        min: 0,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    verificationTokenExpiry: {
        type: Date,
        default: null,
    },
    pendingEmail: {
        type: String,
        default: null,
        lowercase: true,
        trim: true,
    },
    pendingEmailToken: {
        type: String,
        default: null,
    },
    pendingEmailTokenExpiry: {
        type: Date,
        default: null,
    },
    resetToken: {
        type: String,
        default: null,
    },
    resetTokenExpiry: {
        type: Date,
        default: null,
    },
    lastSeen: {
        type: Date,
        default: null,
    },
    lastIp: {
        type: String,
        default: null,
    },
    lastIpAt: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
    },
    country: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 2,
        default: "",
    },
    city: {
        type: String,
        trim: true,
        maxlength: 80,
        default: "",
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    interests: {
        type: [String],
        default: [],
        validate: {
            validator: (values: string[]) =>
                values.length <= MAX_INTERESTS &&
                new Set(values).size === values.length &&
                values.every(isInterestId),
            message: "Interesses inválidos.",
        },
    },
    gender: {
        type: String,
        trim: true,
        default: "",
        validate: {
            validator: (value: string) => !value || isGenderId(value),
            message: "Gênero inválido.",
        },
    },
    birthdate: {
        type: Date,
        default: null,
    },
    languages: {
        type: [String],
        default: [],
        validate: {
            validator: (values: string[]) =>
                values.length <= MAX_LANGUAGES &&
                new Set(values).size === values.length &&
                values.every(isLanguageId),
            message: "Idiomas inválidos.",
        },
    },
    languageLevels: {
        type: Schema.Types.Mixed,
        default: () => ({}),
        validate: {
            validator: (value: unknown) => {
                if (
                    !value ||
                    typeof value !== "object" ||
                    Array.isArray(value)
                ) {
                    return false;
                }
                const entries = Object.entries(
                    value as Record<string, unknown>,
                );
                return (
                    entries.length <= MAX_LANGUAGES &&
                    entries.every(
                        ([code, level]) =>
                            isLanguageId(code) &&
                            typeof level === "string" &&
                            isLanguageLevelId(level),
                    )
                );
            },
            message: "Níveis de idioma inválidos.",
        },
    },
    preferences: {
        type: preferencesSchema,
    },
    blockedUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ pendingEmailToken: 1 }, { sparse: true });
userSchema.index({ resetToken: 1 }, { sparse: true });
userSchema.index({ name: 1, _id: 1 });
userSchema.index({ blockedUsers: 1 });
userSchema.index({ country: 1, city: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ languages: 1 });
userSchema.index({ interests: 1 });

export default mongoose.model<IUser>("User", userSchema);
