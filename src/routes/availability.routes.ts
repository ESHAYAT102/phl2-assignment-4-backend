import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Get tutor availability (tutor only)
router.get(
  "/",
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

      const availability = await prisma.availability.findMany({
        where: { tutorId: tutorProfile.id },
        orderBy: { dayOfWeek: "asc" },
      });

      res.json(availability);
    } catch (error: any) {
      console.error("Get availability error:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  },
);

// Add availability slot (tutor only)
router.post(
  "/",
  authMiddleware,
  requireRole("TUTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { dayOfWeek, startTime, endTime } = req.body;

      // Validation
      if (dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({
          error: "dayOfWeek, startTime, and endTime are required",
        });
      }

      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return res
          .status(400)
          .json({ error: "dayOfWeek must be between 0 and 6" });
      }

      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!tutorProfile) {
        return res.status(404).json({ error: "Tutor profile not found" });
      }

      const availability = await prisma.availability.create({
        data: {
          tutorId: tutorProfile.id,
          dayOfWeek,
          startTime,
          endTime,
        },
      });

      res.status(201).json({
        message: "Availability added successfully",
        availability,
      });
    } catch (error: any) {
      console.error("Add availability error:", error);
      res.status(500).json({ error: "Failed to add availability" });
    }
  },
);

// Delete availability slot (tutor only)
router.delete(
  "/:id",
  authMiddleware,
  requireRole("TUTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return res.status(404).json({ error: "Availability not found" });
      }

      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (tutorProfile?.id !== availability.tutorId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this availability" });
      }

      await prisma.availability.delete({
        where: { id },
      });

      res.json({ message: "Availability deleted successfully" });
    } catch (error: any) {
      console.error("Delete availability error:", error);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  },
);

export default router;
