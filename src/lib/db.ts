import { PrismaClient } from "@prisma/client";

declare global {
  var __bey360Prisma__: PrismaClient | undefined;
}

export const db =
  global.__bey360Prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__bey360Prisma__ = db;
}
