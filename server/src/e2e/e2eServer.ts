import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";

process.env.MONGO_URI = "";
process.env.JWT_SECRET =
    process.env.JWT_SECRET || "e2e-jwt-secret-with-at-least-32-chars-123456";
process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET ||
    "e2e-refresh-secret-with-at-least-32-chars-654321";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.PORT = process.env.PORT || "3001";
process.env.NODE_ENV = "test";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";

async function seed(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("senha123", salt);

    const [alice, bob] = await Promise.all([
        User.create({
            name: "Alice E2E",
            email: "alice@e2e.com",
            password: hashedPassword,
            verified: true,
        }),
        User.create({
            name: "Bob E2E",
            email: "bob@e2e.com",
            password: hashedPassword,
            verified: true,
        }),
    ]);

    const room = await Room.create({
        name: "Sala E2E",
        description: "Sala criada para testes end-to-end",
        type: "group",
        createdBy: alice._id,
        participants: [alice._id, bob._id],
        admins: [alice._id],
    });

    await Message.create({
        sender: alice._id,
        room: room._id,
        content: "Mensagem de boas-vindas E2E",
    });

    console.log(
        "[e2e] seed ok — users: alice@e2e.com / bob@e2e.com (senha: senha123)",
    );
}

async function start(): Promise<void> {
    const mongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongo.getUri();

    await mongoose.connect(process.env.MONGO_URI);
    await seed();
    await mongoose.disconnect();

    await import("../index");
}

start().catch((err) => {
    console.error("[e2e] falha ao iniciar:", err);
    process.exit(1);
});
