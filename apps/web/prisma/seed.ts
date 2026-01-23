import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

async function main() {
  log("Starting seed...");

  // Create or update admin user so ADMIN_EMAIL/ADMIN_PASSWORD from .env always match
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Admin",
      role: Role.admin,
    },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: Role.admin,
    },
  });

  log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("[seed] Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default main;

