import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();

async function main() {
  logger.info("Starting seed...");

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    logger.info("Admin user already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: Role.admin,
    },
  });

  logger.info(`Created admin user: ${admin.email}`);
  logger.info(`Default password: ${adminPassword}`);
  logger.warn("Please change the password after first login!");
}

main()
  .catch((e) => {
    logger.error("Seed failed", e instanceof Error ? e : new Error(String(e)));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default main;

