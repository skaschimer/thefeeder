import path from "path";
import { config } from "dotenv";

// Load .env from app dir or monorepo root (DATABASE_URL for migrate/studio)
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env so prisma generate in Docker build doesn't require DATABASE_URL
    url: process.env.DATABASE_URL ?? "",
  },
});
