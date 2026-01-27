import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Get dashboard statistics (admin only)
router.get(
  "/dashboard",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const [totalUsers, totalTutors, totalBookings, totalReviews] =
        await Promise.all([
          prisma.user.count(),
          prisma.tutorProfile.count(),
          prisma.tutorBooking.count(),
          prisma.review.count(),
        ]);

      const bookingsByStatus = await prisma.tutorBooking.groupBy({
        by: ["status"],
        _count: true,
      });

      const recentBookings = await prisma.tutorBooking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { name: true, email: true },
          },
          tutor: {
            select: { user: { select: { name: true } } },
          },
        },
      });

      res.json({
        statistics: {
          totalUsers,
          totalTutors,
          totalBookings,
          totalReviews,
          bookingsByStatus,
        },
        recentBookings,
      });
    } catch (error: any) {
      console.error("Get dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  },
);

// Get all users (admin only)
router.get(
  "/users",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role, isActive, page = "1", limit = "10", search } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(
        50,
        Math.max(1, parseInt(limit as string) || 10),
      );
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (role && ["STUDENT", "TUTOR", "ADMIN"].includes(role as string)) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      if (search) {
        where.OR = [
          {
            name: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            tutorProfile: {
              select: {
                id: true,
                rating: true,
                hourlyRate: true,
              },
            },
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

// Get single user
router.get(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          tutorProfile: true,
          bookingsAsStudent: true,
          bookingsAsTutor: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },
);

// Update user status (admin only)
router.patch(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: "isActive is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        include: {
          tutorProfile: true,
        },
      });

      res.json({
        message: "User updated successfully",
        user: updated,
      });
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Get all bookings (admin only)
router.get(
  "/bookings",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = "1", limit = "10" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(
        50,
        Math.max(1, parseInt(limit as string) || 10),
      );
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (
        status &&
        ["CONFIRMED", "COMPLETED", "CANCELLED"].includes(status as string)
      ) {
        where.status = status;
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
                    name: true,
                  },
                },
              },
            },
            category: true,
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
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
  },
);

// Delete user (admin only)
router.delete(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent deleting admin accounts
      if (user.role === "ADMIN") {
        return res.status(400).json({ error: "Cannot delete admin accounts" });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

export default router;
