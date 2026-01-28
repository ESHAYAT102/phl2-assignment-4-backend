// CORS configuration for backend
import type { CorsOptions } from "cors";

// Helper function to get allowed origins
const getAllowedOrigins = () => {
  const origins = [];
  
  // Development origins
  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://127.0.0.1:3000"
    );
  }
  
  // Production origins
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Additional Vercel preview URLs (for branch deployments)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Common Vercel patterns for frontend
  origins.push(
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/phl2-assignment-4-frontend.*\.vercel\.app$/
  );
  
  return origins;
};

export const corsOptions: CorsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
  production: [
    process.env.FRONTEND_URL || "https://skillbridge.com",
    /^https:\/\/.*\.vercel\.app$/
  ],
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
  
  const allowedOrigins = getAllowedOrigins();
  
  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    } else if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });
};
