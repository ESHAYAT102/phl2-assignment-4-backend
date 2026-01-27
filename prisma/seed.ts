import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/auth";

const prisma = new PrismaClient();

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

    // Create sample student
    const student1 = await prisma.user.upsert({
      where: { email: "student1@skillbridge.com" },
      update: {},
      create: {
        name: "John Student",
        email: "student1@skillbridge.com",
        password: await hashPassword("student123"),
        phone: "1234567890",
        role: "STUDENT",
        isActive: true,
      },
    });

    // Create sample tutor
    const tutor1 = await prisma.user.upsert({
      where: { email: "tutor1@skillbridge.com" },
      update: {},
      create: {
        name: "Dr. Jane Tutor",
        email: "tutor1@skillbridge.com",
        password: await hashPassword("tutor123"),
        phone: "9876543210",
        role: "TUTOR",
        isActive: true,
      },
    });

    // Create tutor profile
    const tutorProfile = await prisma.tutorProfile.upsert({
      where: { userId: tutor1.id },
      update: {},
      create: {
        userId: tutor1.id,
        bio: "Experienced Mathematics and Programming tutor with 5+ years of teaching experience. Specialized in making complex concepts easy to understand.",
        hourlyRate: 50,
        subjects: ["Mathematics", "Programming"],
        qualifications: "M.Sc. in Computer Science",
        experience: 5,
        isVerified: true,
        rating: 0,
        totalReviews: 0,
      },
    });

    console.log("✓ Sample users and tutor profile created");
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
