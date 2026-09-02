import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types";

const messageSchema = new Schema<IMessage>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        content: {
            type: String,
            trim: true,
            maxlength: 2000,
            required: function (this: { attachments?: unknown[] }) {
                return !this.attachments || this.attachments.length === 0;
            },
        },
        type: {
            type: String,
            enum: ["text", "system"],
            default: "text",
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        deletedFor: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        edited: {
            type: Boolean,
            default: false,
        },
        reactions: {
            type: Map,
            of: [{ type: Schema.Types.ObjectId, ref: "User" }],
            default: {},
        },
        attachments: [
            {
                url: { type: String, required: true },
                filename: { type: String, required: true },
                mimetype: { type: String, required: true },
                size: { type: Number, required: true },
                publicId: { type: String },
            },
        ],
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        mentions: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        parentMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        clientMessageId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

messageSchema.index({ room: 1, createdAt: -1, _id: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ parentMessage: 1, createdAt: 1 });
messageSchema.index({ room: 1, mentions: 1, createdAt: -1 });
messageSchema.index(
    { sender: 1, clientMessageId: 1 },
    {
        unique: true,
        partialFilterExpression: { clientMessageId: { $type: "string" } },
    },
);

export default mongoose.model<IMessage>("Message", messageSchema);
