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

    // Create sample students
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

    const student2 = await prisma.user.upsert({
      where: { email: "student2@skillbridge.com" },
      update: {},
      create: {
        name: "Jane Learner",
        email: "student2@skillbridge.com",
        password: await hashPassword("student123"),
        phone: "1234567891",
        role: "STUDENT",
        isActive: true,
      },
    });

    // Create sample tutors
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

    const tutor2 = await prisma.user.upsert({
      where: { email: "tutor2@skillbridge.com" },
      update: {},
      create: {
        name: "Prof. John Smith",
        email: "tutor2@skillbridge.com",
        password: await hashPassword("tutor123"),
        phone: "9876543211",
        role: "TUTOR",
        isActive: true,
      },
    });

    const tutor3 = await prisma.user.upsert({
      where: { email: "tutor3@skillbridge.com" },
      update: {},
      create: {
        name: "Alex Code",
        email: "tutor3@skillbridge.com",
        password: await hashPassword("tutor123"),
        phone: "9876543212",
        role: "TUTOR",
        isActive: true,
      },
    });

    // Create tutor profiles
    const tutorProfile1 = await prisma.tutorProfile.upsert({
      where: { userId: tutor1.id },
      update: {},
      create: {
        userId: tutor1.id,
        bio: "Experienced Mathematics and Science tutor with 5+ years of teaching experience. Specialized in making complex concepts easy to understand.",
        hourlyRate: 50,
        subjects: ["Mathematics", "Science"],
        qualifications: "M.Sc. in Mathematics",
        experience: 5,
        isVerified: true,
        rating: 4.8,
        totalReviews: 12,
      },
    });

    const tutorProfile2 = await prisma.tutorProfile.upsert({
      where: { userId: tutor2.id },
      update: {},
      create: {
        userId: tutor2.id,
        bio: "English Literature professor with passion for helping students excel. Native speaker with extensive academic background.",
        hourlyRate: 45,
        subjects: ["English", "History"],
        qualifications: "PhD in English Literature",
        experience: 8,
        isVerified: true,
        rating: 4.9,
        totalReviews: 15,
      },
    });

    const tutorProfile3 = await prisma.tutorProfile.upsert({
      where: { userId: tutor3.id },
      update: {},
      create: {
        userId: tutor3.id,
        bio: "Full-stack web developer and coding instructor. Help students master programming from basics to advanced concepts.",
        hourlyRate: 60,
        subjects: ["Programming"],
        qualifications: "B.Tech Computer Science",
        experience: 6,
        isVerified: true,
        rating: 4.7,
        totalReviews: 20,
      },
    });

    console.log("✓ Tutors and profiles created");

    // Create sample bookings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const booking1 = await prisma.tutorBooking.create({
      data: {
        studentId: student1.id,
        tutorId: tutorProfile1.id,
        categoryId: categories[0].id, // Mathematics
        subject: "Calculus",
        sessionDate: tomorrow,
        duration: 60,
        status: "CONFIRMED",
        notes: "Please focus on integration techniques",
        paymentMethod: "CASH_ON_DELIVERY",
        price: 50,
      },
    });

    const booking2 = await prisma.tutorBooking.create({
      data: {
        studentId: student2.id,
        tutorId: tutorProfile2.id,
        categoryId: categories[1].id, // English
        subject: "Shakespeare",
        sessionDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
        duration: 90,
        status: "CONFIRMED",
        paymentMethod: "CASH_ON_DELIVERY",
        price: 67.5,
      },
    });

    console.log("✓ Sample bookings created");

    // Create sample reviews
    const completedBooking = await prisma.tutorBooking.create({
      data: {
        studentId: student1.id,
        tutorId: tutorProfile2.id,
        categoryId: categories[1].id,
        subject: "Essay Writing",
        sessionDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        duration: 60,
        status: "COMPLETED",
        paymentMethod: "CASH_ON_DELIVERY",
        price: 45,
      },
    });

    const review = await prisma.review.create({
      data: {
        bookingId: completedBooking.id,
        tutorId: tutorProfile2.id,
        studentId: student1.id,
        rating: 5,
        comment: "Excellent tutor! Very knowledgeable and patient.",
      },
    });

    console.log("✓ Sample reviews created");

    console.log("\n📊 Database seeding completed successfully!");
    console.log("\n✅ Admin Credentials:");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log("\n✅ Sample Student Account:");
    console.log(`   Email: ${student1.email}`);
    console.log(`   Password: student123`);
    console.log("\n✅ Sample Tutor Account:");
    console.log(`   Email: ${tutor1.email}`);
    console.log(`   Password: tutor123`);
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
