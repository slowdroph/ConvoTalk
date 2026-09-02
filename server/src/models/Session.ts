import mongoose, { Schema } from "mongoose";
import type { ISession } from "../types";

const sessionSchema = new Schema<ISession>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
    },
    deviceType: {
        type: String,
        enum: ["web", "mobile", "desktop", "unknown"],
        default: "web",
    },
    userAgent: {
        type: String,
        maxlength: 500,
        default: "",
    },
    ip: {
        type: String,
        default: null,
    },
    deviceLabel: {
        type: String,
        maxlength: 200,
        default: "",
    },
    lastActiveAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ token: 1 }, { unique: true });
sessionSchema.index({ userId: 1, lastActiveAt: -1 });
sessionSchema.index(
    { lastActiveAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export default mongoose.model<ISession>("Session", sessionSchema);
