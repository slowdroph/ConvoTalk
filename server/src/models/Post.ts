import mongoose, { Schema } from "mongoose";
import { IAttachment, IPost } from "../types";

const postImageSchema = new Schema<IAttachment>(
    {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        publicId: { type: String },
    },
    { _id: false },
);

const postSchema = new Schema<IPost>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        image: {
            type: postImageSchema,
            default: null,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        likeCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        commentCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        edited: {
            type: Boolean,
            default: false,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        clientPostId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likeCount: -1, _id: -1 });
postSchema.index(
    { author: 1, clientPostId: 1 },
    {
        unique: true,
        partialFilterExpression: { clientPostId: { $type: "string" } },
    },
);

export default mongoose.model<IPost>("Post", postSchema);
