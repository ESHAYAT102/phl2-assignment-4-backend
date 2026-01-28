import { Router, Request, Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Create review (student only, after booking is completed)
router.post(
  "/",
  authMiddleware,
  requireRole("STUDENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { bookingId, rating, comment } = req.body;

      // Validation - required fields
      if (!bookingId || !rating) {
        return res.status(400).json({
          error: "bookingId and rating are required",
        });
      }

      // Validate bookingId
      if (typeof bookingId !== "string" || bookingId.trim() === "") {
        return res.status(400).json({ error: "Valid bookingId is required" });
      }

      // Validate rating
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be an integer between 1 and 5" });
      }

      // Validate comment if provided
      if (comment) {
        if (typeof comment !== "string") {
          return res.status(400).json({ error: "Comment must be a string" });
        }
        if (comment.trim().length === 0) {
          return res
            .status(400)
            .json({ error: "Comment cannot be empty if provided" });
        }
        if (comment.length > 1000) {
          return res
            .status(400)
            .json({ error: "Comment must be less than 1000 characters" });
        }
      }

      // Check if booking exists and belongs to student
      const booking = await prisma.tutorBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.studentId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to review this booking" });
      }

      // Check if booking is completed
      if (booking.status !== "COMPLETED") {
        return res.status(400).json({
          error: "Can only review completed bookings",
        });
      }

      // Check if review already exists
      const existingReview = await prisma.review.findUnique({
        where: { bookingId },
      });

      if (existingReview) {
        return res
          .status(400)
          .json({ error: "Review already exists for this booking" });
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          bookingId,
          tutorId: booking.tutorId,
          studentId: req.user.userId,
          rating,
          comment: comment || null,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update tutor rating
      const allReviews = await prisma.review.findMany({
        where: { tutorId: booking.tutorId },
      });

      const averageRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.tutorProfile.update({
        where: { id: booking.tutorId },
        data: {
          rating: parseFloat(averageRating.toFixed(2)),
          totalReviews: allReviews.length,
        },
      });

      res.status(201).json({
        message: "Review created successfully",
        review,
      });
    } catch (error: any) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  },
);

// Get reviews for a tutor
router.get("/tutor/:tutorId", async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Check if tutor exists
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { tutorId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { tutorId } }),
    ]);

    res.json({
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get single review
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        tutor: true,
        booking: true,
      },
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error: any) {
    console.error("Get review error:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Update review (student only)
router.put(
  "/:id",
  authMiddleware,
  requireRole("STUDENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { rating, comment } = req.body;

      // Validation
      if (!rating) {
        return res.status(400).json({ error: "rating is required" });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }

      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.studentId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this review" });
      }

      const updated = await prisma.review.update({
        where: { id },
        data: {
          rating,
          comment: comment !== undefined ? comment : review.comment,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update tutor rating
      const allReviews = await prisma.review.findMany({
        where: { tutorId: review.tutorId },
      });

      const averageRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.tutorProfile.update({
        where: { id: review.tutorId },
        data: {
          rating: parseFloat(averageRating.toFixed(2)),
          totalReviews: allReviews.length,
        },
      });

      res.json({
        message: "Review updated successfully",
        review: updated,
      });
    } catch (error: any) {
      console.error("Update review error:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  },
);

// Delete review (student only)
router.delete(
  "/:id",
  authMiddleware,
  requireRole("STUDENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.studentId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this review" });
      }

      const tutorId = review.tutorId;

      await prisma.review.delete({
        where: { id },
      });

      // Update tutor rating
      const allReviews = await prisma.review.findMany({
        where: { tutorId },
      });

      if (allReviews.length > 0) {
        const averageRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await prisma.tutorProfile.update({
          where: { id: tutorId },
          data: {
            rating: parseFloat(averageRating.toFixed(2)),
            totalReviews: allReviews.length,
          },
        });
      } else {
        await prisma.tutorProfile.update({
          where: { id: tutorId },
          data: {
            rating: 0,
            totalReviews: 0,
          },
        });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error: any) {
      console.error("Delete review error:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  },
);

export default router;
