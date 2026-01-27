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

      // Validation - required fields
      if (dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({
          error: "dayOfWeek, startTime, and endTime are required",
        });
      }

      // Validate dayOfWeek
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res
          .status(400)
          .json({ error: "dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)" });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return res
          .status(400)
          .json({ error: "startTime must be in HH:MM format (24-hour)" });
      }
      if (!timeRegex.test(endTime)) {
        return res
          .status(400)
          .json({ error: "endTime must be in HH:MM format (24-hour)" });
      }

      // Validate time ordering
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      if (start >= end) {
        return res
          .status(400)
          .json({ error: "endTime must be after startTime" });
      }

      // Validate slot duration (at least 30 minutes)
      const durationMinutes =
        (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 30) {
        return res.status(400).json({
          error: "Availability slot must be at least 30 minutes",
        });
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
