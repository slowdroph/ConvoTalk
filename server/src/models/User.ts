import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

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
    verificationToken: {
        type: String,
        default: null,
    },
    verificationTokenExpiry: {
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
    refreshToken: {
        type: String,
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
userSchema.index({ resetToken: 1 }, { sparse: true });

export default mongoose.model<IUser>("User", userSchema);
