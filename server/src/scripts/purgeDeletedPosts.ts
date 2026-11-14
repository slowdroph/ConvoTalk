import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db";
import { purgeSoftDeletedPosts } from "../services/post";

async function main(): Promise<void> {
    await connectDB();
    try {
        const result = await purgeSoftDeletedPosts();
        if (result.posts === 0) {
            console.log("Nenhum post marcado como excluído foi encontrado.");
            return;
        }
        console.log(
            `Posts removidos: ${result.posts}; comentários: ${result.comments}; salvos: ${result.savedPosts}.`,
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error("Falha ao remover posts excluídos:", error);
    process.exitCode = 1;
});
