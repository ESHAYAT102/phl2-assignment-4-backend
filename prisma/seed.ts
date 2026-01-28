import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { hashPassword } from "../src/utils/auth";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Setup Neon configuration
neonConfig.webSocketConstructor = ws;

// Create Prisma client with Neon adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: "Mathematics" },
        update: {},
        create: {
          name: "Mathematics",
          description: "Math tutoring for all levels",
        },
      }),
      prisma.category.upsert({
        where: { name: "English" },
        update: {},
        create: {
          name: "English",
          description: "English language and literature",
        },
      }),
      prisma.category.upsert({
        where: { name: "Science" },
        update: {},
        create: {
          name: "Science",
          description: "Physics, Chemistry, Biology",
        },
      }),
      prisma.category.upsert({
        where: { name: "Programming" },
        update: {},
        create: {
          name: "Programming",
          description: "Web development and coding",
        },
      }),
      prisma.category.upsert({
        where: { name: "History" },
        update: {},
        create: {
          name: "History",
          description: "World and local history",
        },
      }),
    ]);

    console.log(`✓ Created ${categories.length} categories`);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@skillbridge.com" },
      update: {},
      create: {
        name: "Admin",
        email: "admin@skillbridge.com",
        password: await hashPassword("admin123"),
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("✓ Admin user created/updated");

    console.log("\n📊 Database seeding completed successfully!");
    console.log("\n✅ Admin Credentials:");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
