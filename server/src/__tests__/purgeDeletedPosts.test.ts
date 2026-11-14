import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import Post from "../models/Post";
import Comment from "../models/Comment";
import SavedPost from "../models/SavedPost";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import { purgeSoftDeletedPosts } from "../services/post";

beforeAll(async () => {
    await startTestDb();
}, 180_000);

afterAll(async () => {
    await stopTestDb();
}, 30_000);

beforeEach(async () => {
    await clearTestDb();
});

async function createUser(name: string, email: string) {
    return User.create({
        name,
        email,
        publicId: generatePublicId(),
        password: "password123",
        verified: true,
    });
}

describe("purge de posts soft-deleted", () => {
    it("remove posts legados e seus dados relacionados", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const legacy = await Post.create({
            author: alice._id,
            content: "Post antigo excluído",
            deleted: true,
        });
        const active = await Post.create({
            author: alice._id,
            content: "Post ativo",
        });

        await Comment.create({
            post: legacy._id,
            author: alice._id,
            content: "Comentário órfão",
        });
        await SavedPost.create({
            user: alice._id,
            post: legacy._id,
        });

        const result = await purgeSoftDeletedPosts();

        expect(result).toEqual({ posts: 1, comments: 1, savedPosts: 1 });
        expect(await Post.findById(legacy._id).lean()).toBeNull();
        expect(await Post.findById(active._id).lean()).not.toBeNull();
        expect(await Comment.countDocuments({ post: legacy._id })).toBe(0);
        expect(await SavedPost.countDocuments({ post: legacy._id })).toBe(0);
    });

    it("é seguro quando não há posts marcados como excluídos", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        await Post.create({ author: alice._id, content: "Post ativo" });

        const result = await purgeSoftDeletedPosts();

        expect(result).toEqual({ posts: 0, comments: 0, savedPosts: 0 });
    });
});
