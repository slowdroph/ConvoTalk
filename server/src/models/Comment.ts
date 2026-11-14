import mongoose, { Schema } from "mongoose";
import { IComment } from "../types";

const commentSchema = new Schema<IComment>(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        clientCommentId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: -1, _id: -1 });
commentSchema.index(
    { post: 1, author: 1, clientCommentId: 1 },
    {
        unique: true,
        partialFilterExpression: { clientCommentId: { $type: "string" } },
    },
);

export default mongoose.model<IComment>("Comment", commentSchema);
