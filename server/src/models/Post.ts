import mongoose, { Schema } from "mongoose";
import { IAttachment, IPoll, IPollOption, IPost } from "../types";

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

const pollOptionSchema = new Schema<IPollOption>({
    text: { type: String, required: true, trim: true, maxlength: 100 },
    votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const pollSchema = new Schema<IPoll>(
    {
        options: { type: [pollOptionSchema], required: true },
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
        profile: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
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
        poll: {
            type: pollSchema,
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
postSchema.index({ profile: 1, createdAt: -1, _id: -1 });
postSchema.index({ likeCount: -1, _id: -1 });
postSchema.index(
    { author: 1, clientPostId: 1 },
    {
        unique: true,
        partialFilterExpression: { clientPostId: { $type: "string" } },
    },
);

export default mongoose.model<IPost>("Post", postSchema);
