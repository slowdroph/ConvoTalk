import mongoose, { Schema } from "mongoose";
import type { IReadLog } from "../types";

const readLogSchema = new Schema<IReadLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    sessionId: {
        type: Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
    messageId: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        required: true,
        index: true,
    },
    roomId: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true,
        index: true,
    },
    readAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

readLogSchema.index({ messageId: 1, userId: 1, sessionId: 1 }, { unique: true });
readLogSchema.index({ roomId: 1, userId: 1, readAt: -1 });

readLogSchema.index(
    { readAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

export default mongoose.model<IReadLog>("ReadLog", readLogSchema);
