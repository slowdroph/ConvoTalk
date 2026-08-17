import Message from "../models/Message";
import { IMessage } from "../types";

export const POPULATE_SENDER = "sender name avatar status";

export const POPULATE_PARENT = {
    path: "parentMessage",
    select: "sender content attachments deleted",
    populate: { path: "sender", select: "name avatar status" },
};

export async function findMessageWithSenders(id: string): Promise<IMessage | null> {
    return Message.findById(id)
        .populate(POPULATE_SENDER)
        .populate(POPULATE_PARENT)
        .lean();
}
