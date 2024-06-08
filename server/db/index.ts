import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const isDbConnected = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed", error);
    return false;
  }
};

export default prisma;
