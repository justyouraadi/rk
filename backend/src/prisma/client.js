import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set in environment variables.");
    }

    try {
        const parsed = new URL(connectionString);
        const adapter = new PrismaMariaDb({
            host: parsed.hostname,
            port: parseInt(parsed.port || "3306", 10),
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.replace(/^\//, ""),
            connectTimeout: 30000,
            acquireTimeout: 30000,
            connectionLimit: 10,
        });

        return new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        });
    } catch {
        const adapter = new PrismaMariaDb(connectionString);
        return new PrismaClient({ adapter });
    }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
