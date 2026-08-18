import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

// Connect on load
prisma.$connect()
    .then(() => logger.info("Connected to PostgreSQL via Prisma"))
    .catch((err) => {
        logger.fatal({ err }, "Failed to connect to PostgreSQL");
        process.exit(1);
    });

export default prisma;
