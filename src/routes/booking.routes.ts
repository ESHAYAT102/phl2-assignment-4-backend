import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

// Create booking (student only)
router.post(
  "/",
  authMiddleware,
  requireRole("STUDENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        tutorId,
        categoryId,
        subject,
        sessionDate,
        duration,
        notes,
        price,
      } = req.body;

      // Validation - required fields
      if (
        !tutorId ||
        !categoryId ||
        !subject ||
        !sessionDate ||
        !duration ||
        !price
      ) {
        return res.status(400).json({
          error:
            "tutorId, categoryId, subject, sessionDate, duration, and price are required",
        });
      }

      // Validate string fields
      if (typeof tutorId !== "string" || tutorId.trim() === "") {
        return res.status(400).json({ error: "Valid tutorId is required" });
      }
      if (typeof categoryId !== "string" || categoryId.trim() === "") {
        return res.status(400).json({ error: "Valid categoryId is required" });
      }
      if (typeof subject !== "string" || subject.trim() === "") {
        return res.status(400).json({ error: "Subject cannot be empty" });
      }
      if (subject.length > 100) {
        return res
          .status(400)
          .json({ error: "Subject must be less than 100 characters" });
      }
      if (notes && typeof notes === "string" && notes.length > 500) {
        return res
          .status(400)
          .json({ error: "Notes must be less than 500 characters" });
      }

      // Validate sessionDate
      const bookingDate = new Date(sessionDate);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ error: "Invalid session date format" });
      }
      if (bookingDate < new Date()) {
        return res
          .status(400)
          .json({ error: "Session date must be in the future" });
      }

      // Validate duration
      if (!Number.isInteger(duration) || duration <= 0 || duration > 480) {
        return res.status(400).json({
          error: "Duration must be an integer between 1 and 480 minutes",
        });
      }

      // Validate price
      if (typeof price !== "number" || price <= 0) {
        return res
          .status(400)
          .json({ error: "Price must be a positive number" });
      }
      if (price > 10000) {
        return res.status(400).json({ error: "Price cannot exceed 10000" });
      }

      // Check if tutor exists
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
      });

      if (!tutor) {
        return res.status(404).json({ error: "Tutor not found" });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Check if booking date is in the future
      if (bookingDate <= new Date()) {
        return res
          .status(400)
          .json({ error: "Booking date must be in the future" });
      }

      // Create booking
      const booking = await prisma.tutorBooking.create({
        data: {
          studentId: req.user.userId,
          tutorId,
          categoryId,
          subject,
          sessionDate: bookingDate,
          duration,
          notes: notes || null,
          price,
          status: "CONFIRMED",
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tutor: true,
          category: true,
        },
      });

      res.status(201).json({
        message: "Booking created successfully",
        booking,
      });
    } catch (error: any) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  },
);

// Get user's bookings
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { status, page, limit } = req.query;

    const pageNum = Math.max(
      1,
      parseInt(String((Array.isArray(page) ? page[0] : page) || "1")) || 1,
    );
    const limitNum = Math.min(
      50,
      Math.max(
        1,
        parseInt(String((Array.isArray(limit) ? limit[0] : limit) || "10")) ||
          10,
      ),
    );
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by user role
    if (req.user.role === "STUDENT") {
      where.studentId = req.user.userId;
    } else if (req.user.role === "TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!tutorProfile) {
        return res.status(404).json({ error: "Tutor profile not found" });
      }

      where.tutorId = tutorProfile.id;
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    // Filter by status
    const statusValue = Array.isArray(status) ? status[0] : status;
    if (
      statusValue &&
      ["CONFIRMED", "COMPLETED", "CANCELLED"].includes(statusValue as string)
    ) {
      where.status = statusValue;
    }

    const [bookings, total] = await Promise.all([
      prisma.tutorBooking.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          category: true,
          review: true,
        },
        skip,
        take: limitNum,
        orderBy: { sessionDate: "desc" },
      }),
      prisma.tutorBooking.count({ where }),
    ]);

    res.json({
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get single booking
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const booking = await prisma.tutorBooking.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        category: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check authorization
    if (req.user.userId !== booking.studentId && req.user.role !== "ADMIN") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (tutorProfile?.id !== booking.tutorId) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this booking" });
      }
    }

    res.json(booking);
  } catch (error: any) {
    console.error("Get booking error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Update booking status
router.patch(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const statusValue = Array.isArray(req.body.status)
        ? req.body.status[0]
        : req.body.status;

      if (
        !statusValue ||
        !["CONFIRMED", "COMPLETED", "CANCELLED"].includes(statusValue)
      ) {
        return res.status(400).json({
          error: "status must be CONFIRMED, COMPLETED, or CANCELLED",
        });
      }

      const booking = await prisma.tutorBooking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Check authorization
      if (req.user.role === "STUDENT") {
        if (booking.studentId !== req.user.userId) {
          return res
            .status(403)
            .json({ error: "Not authorized to update this booking" });
        }
        // Students can only cancel
        if (statusValue !== "CANCELLED") {
          return res
            .status(403)
            .json({ error: "Students can only cancel bookings" });
        }
      } else if (req.user.role === "TUTOR") {
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { userId: req.user.userId },
        });

        if (tutorProfile?.id !== booking.tutorId) {
          return res
            .status(403)
            .json({ error: "Not authorized to update this booking" });
        }
        // Tutors can mark as completed or cancel
        if (!["COMPLETED", "CANCELLED"].includes(statusValue)) {
          return res.status(403).json({
            error: "Tutors can only mark as completed or cancel",
          });
        }
      } else if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await prisma.tutorBooking.update({
        where: { id },
        data: { status: statusValue },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tutor: true,
          category: true,
        },
      });

      res.json({
        message: "Booking updated successfully",
        booking: updated,
      });
    } catch (error: any) {
      console.error("Update booking error:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  },
);

// Cancel booking
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      const booking = await prisma.tutorBooking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Check authorization
      if (
        req.user.role === "STUDENT" &&
        booking.studentId !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this booking" });
      }

      if (req.user.role === "TUTOR") {
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { userId: req.user.userId },
        });

        if (tutorProfile?.id !== booking.tutorId) {
          return res
            .status(403)
            .json({ error: "Not authorized to delete this booking" });
        }
      } else if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this booking" });
      }

      await prisma.tutorBooking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      res.json({ message: "Booking cancelled successfully" });
    } catch (error: any) {
      console.error("Delete booking error:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  },
);

export default router;
