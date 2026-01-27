// CORS configuration for backend
import { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://skillbridge.com"
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
        ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

// Trusted origins for different environments
export const trustedOrigins = {
  development: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
  ],
  staging: [process.env.STAGING_URL || "https://staging-skillbridge.com"],
  production: [process.env.FRONTEND_URL || "https://skillbridge.com"],
};

export const getCurrentTrustedOrigins = () => {
  const env = process.env.NODE_ENV || "development";
  return (
    trustedOrigins[env as keyof typeof trustedOrigins] ||
    trustedOrigins.development
  );
};

// Custom origin verification
export const verifyOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests without origin (like Postman)
  return getCurrentTrustedOrigins().includes(origin);
};
