import mongoose from "mongoose";
import { logger } from "./logger";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    logger.info({ host: conn.connection.host }, "MongoDB conectado");
  } catch (error) {
    logger.error({ error }, "erro ao conectar ao MongoDB");
    process.exit(1);
  }
};

export default connectDB;
