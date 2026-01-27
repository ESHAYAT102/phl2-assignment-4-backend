import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all categories (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error: any) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get single category
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error: any) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Create category (admin only)
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }

      // Validate name type and length
      if (typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ error: "Category name must be a non-empty string" });
      }
      if (name.length > 50) {
        return res
          .status(400)
          .json({ error: "Category name must be less than 50 characters" });
      }

      // Validate description if provided
      if (description !== undefined) {
        if (typeof description !== "string") {
          return res
            .status(400)
            .json({ error: "Description must be a string" });
        }
        if (description.length > 500) {
          return res.status(400).json({
            error: "Description must be less than 500 characters",
          });
        }
      }

      // Check if category exists
      const existing = await prisma.category.findUnique({
        where: { name: name.trim() },
      });

      if (existing) {
        return res.status(400).json({ error: "Category already exists" });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error: any) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  },
);

// Update category (admin only)
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate id
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Valid category ID is required" });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Validate and normalize name if provided
      if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
          return res
            .status(400)
            .json({ error: "Category name must be a non-empty string" });
        }
        if (name.length > 50) {
          return res
            .status(400)
            .json({ error: "Category name must be less than 50 characters" });
        }

        // Check if new name is unique
        if (name.trim() !== category.name) {
          const existing = await prisma.category.findUnique({
            where: { name: name.trim() },
          });

          if (existing) {
            return res
              .status(400)
              .json({ error: "Category name already exists" });
          }
        }
      }

      // Validate description if provided
      if (description !== undefined) {
        if (typeof description !== "string") {
          return res
            .status(400)
            .json({ error: "Description must be a string" });
        }
        if (description.length > 500) {
          return res.status(400).json({
            error: "Description must be less than 500 characters",
          });
        }
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: name ? name.trim() : category.name,
          description:
            description !== undefined ? description.trim() || null : category.description,
        },
      });

      res.json({
        message: "Category updated successfully",
        category: updated,
      });
    } catch (error: any) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  },
);

// Delete category (admin only)
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      await prisma.category.delete({
        where: { id },
      });

      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  },
);

export default router;
