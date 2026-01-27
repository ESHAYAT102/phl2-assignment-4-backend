import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { hashPassword, comparePasswords, generateToken } from "../utils/auth";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ResponseHelper } from "../utils/response";
import { ErrorLogger, ErrorSeverity } from "../utils/logger";

const router = Router();

// Validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Register endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return ResponseHelper.badRequest(
        res,
        "name, email, password, and role are required"
      );
    }

    if (!validateEmail(email)) {
      return ResponseHelper.badRequest(res, "Invalid email format");
    }

    if (password.length < 8) {
      return ResponseHelper.badRequest(
        res,
        "Password must be at least 8 characters"
      );
    }

    if (!["STUDENT", "TUTOR", "ADMIN"].includes(role)) {
      return ResponseHelper.badRequest(res, "Invalid role");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ResponseHelper.conflict(res, "User already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
      },
    });

    // If tutor, create tutor profile
    if (role === "TUTOR") {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ResponseHelper.created(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    }, "User registered successfully");
  } catch (error: any) {
    ErrorLogger.log(error, "Register endpoint", ErrorSeverity.HIGH);
    if (ErrorLogger.isDatabaseError(error)) {
      return ResponseHelper.internalError(res, ErrorLogger.handleValidationError(error));
    }
    return ResponseHelper.internalError(res, "Failed to register user");
  }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return ResponseHelper.badRequest(
        res,
        "Email and password are required"
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tutorProfile: true,
      },
    });

    if (!user) {
      return ResponseHelper.unauthorized(res, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseHelper.forbidden(res, "Your account has been disabled");
    }

    // Compare passwords
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return ResponseHelper.unauthorized(res, "Invalid email or password");
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ResponseHelper.success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tutorProfile: user.tutorProfile,
      },
      token,
    }, 200, "Login successful");
  } catch (error: any) {
    ErrorLogger.log(error, "Login endpoint", ErrorSeverity.MEDIUM);
    return ResponseHelper.internalError(res, "Failed to login");
  }
});

// Get current user endpoint
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return ResponseHelper.unauthorized(res, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        tutorProfile: true,
      },
    });

    if (!user) {
      return ResponseHelper.notFound(res, "User not found");
    }

    return ResponseHelper.success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        tutorProfile: user.tutorProfile,
      },
    });
  } catch (error: any) {
    ErrorLogger.log(error, "Get current user endpoint", ErrorSeverity.MEDIUM);
    return ResponseHelper.internalError(res, "Failed to get user");
  }
});

export default router;
