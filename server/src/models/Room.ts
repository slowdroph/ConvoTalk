import mongoose, { Schema } from "mongoose";
import { IRoom } from "../types";

const roomSchema = new Schema<IRoom>({
    name: {
        type: String,
        trim: true,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    type: {
        type: String,
        enum: ["group", "direct"],
        default: "group",
    },
    visibility: {
        type: String,
        enum: ["private", "public"],
        default: "private",
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    admins: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    avatar: {
        type: String,
        default: "",
    },
    lastReadAt: {
        type: Map,
        of: Date,
        default: {},
    },
    lastMessageAt: {
        type: Date,
        default: null,
    },
    pinnedMessages: [
        {
            message: {
                type: Schema.Types.ObjectId,
                ref: "Message",
                required: true,
            },
            pinnedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            pinnedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

roomSchema.index({ type: 1, participants: 1 });
roomSchema.index({ participants: 1, lastMessageAt: -1 });
roomSchema.index({ visibility: 1, type: 1, name: 1 });

export default mongoose.model<IRoom>("Room", roomSchema);
