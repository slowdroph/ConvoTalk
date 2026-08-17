import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer | null = null;

export async function startTestDb(): Promise<void> {
    if (mongoose.connection.readyState === 1) return;
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: "test" });
}

export async function stopTestDb(): Promise<void> {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
}

export async function clearTestDb(): Promise<void> {
    const collections = mongoose.connection.collections;
    await Promise.all(
        Object.values(collections).map((col) => col.deleteMany({})),
    );
}
