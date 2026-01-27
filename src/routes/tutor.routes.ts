import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all tutors (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      subject,
      minRating,
      maxPrice,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by subject
    if (subject) {
      where.subjects = {
        hasSome: [(subject as string).toLowerCase()],
      };
    }

    // Filter by rating
    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating as string),
      };
    }

    // Filter by hourly rate
    if (maxPrice) {
      where.hourlyRate = {
        lte: parseFloat(maxPrice as string),
      };
    }

    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { rating: "desc" },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    res.json({
      data: tutors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get tutors error:", error);
    res.status(500).json({ error: "Failed to fetch tutors" });
  }
});

// Get single tutor profile (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tutor = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        availability: true,
        reviews: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    res.json(tutor);
  } catch (error: any) {
    console.error("Get tutor error:", error);
    res.status(500).json({ error: "Failed to fetch tutor" });
  }
});

// Update tutor profile (tutor only)
router.put(
  "/",
  authMiddleware,
  requireRole("TUTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { bio, hourlyRate, subjects, qualifications, experience } =
        req.body;

      // Validate bio
      if (bio !== undefined) {
        if (typeof bio !== "string") {
          return res.status(400).json({ error: "Bio must be a string" });
        }
        if (bio.length > 2000) {
          return res
            .status(400)
            .json({ error: "Bio must be less than 2000 characters" });
        }
      }

      // Validate hourlyRate
      if (hourlyRate !== undefined) {
        if (typeof hourlyRate !== "number" || hourlyRate < 0 || hourlyRate > 10000) {
          return res.status(400).json({
            error: "Hourly rate must be a number between 0 and 10000",
          });
        }
      }

      // Validate subjects
      if (subjects !== undefined) {
        if (!Array.isArray(subjects)) {
          return res.status(400).json({ error: "Subjects must be an array" });
        }
        if (subjects.length > 20) {
          return res
            .status(400)
            .json({ error: "Cannot add more than 20 subjects" });
        }
        if (subjects.some((s) => typeof s !== "string" || s.trim() === "")) {
          return res
            .status(400)
            .json({ error: "Each subject must be a non-empty string" });
        }
      }

      // Validate qualifications
      if (qualifications !== undefined) {
        if (typeof qualifications !== "string") {
          return res
            .status(400)
            .json({ error: "Qualifications must be a string" });
        }
        if (qualifications.length > 1000) {
          return res.status(400).json({
            error: "Qualifications must be less than 1000 characters",
          });
        }
      }

      // Validate experience
      if (experience !== undefined) {
        if (!Number.isInteger(experience) || experience < 0 || experience > 100) {
          return res.status(400).json({
            error: "Experience must be an integer between 0 and 100 years",
          });
        }
      }

      // Get tutor profile
      let tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!tutorProfile) {
        return res.status(404).json({ error: "Tutor profile not found" });
      }

      // Update profile
      tutorProfile = await prisma.tutorProfile.update({
        where: { userId: req.user.userId },
        data: {
          bio: bio !== undefined ? bio : tutorProfile.bio,
          hourlyRate:
            hourlyRate !== undefined ? hourlyRate : tutorProfile.hourlyRate,
          subjects: subjects || tutorProfile.subjects,
          qualifications:
            qualifications !== undefined
              ? qualifications
              : tutorProfile.qualifications,
          experience:
            experience !== undefined ? experience : tutorProfile.experience,
        },
      });

      res.json({
        message: "Tutor profile updated successfully",
        tutor: tutorProfile,
      });
    } catch (error: any) {
      console.error("Update tutor error:", error);
      res.status(500).json({ error: "Failed to update tutor profile" });
    }
  },
);

// Get tutors bookings (tutor only)
router.get(
  "/me/bookings",
  authMiddleware,
  requireRole("TUTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!tutorProfile) {
        return res.status(404).json({ error: "Tutor profile not found" });
      }

      const bookings = await prisma.tutorBooking.findMany({
        where: { tutorId: tutorProfile.id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          category: true,
          review: true,
        },
        orderBy: { sessionDate: "desc" },
      });

      res.json(bookings);
    } catch (error: any) {
      console.error("Get tutor bookings error:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  },
);

export default router;
