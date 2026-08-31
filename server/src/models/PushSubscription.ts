import mongoose, { Schema } from "mongoose";
import { IPushSubscription } from "../types";

const pushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        endpoint: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        keys: {
            p256dh: {
                type: String,
                required: true,
                trim: true,
            },
            auth: {
                type: String,
                required: true,
                trim: true,
            },
        },
        userAgent: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

export default mongoose.model<IPushSubscription>(
    "PushSubscription",
    pushSubscriptionSchema,
);
