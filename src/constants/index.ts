// Backend constants

// Application
export const APP_NAME = "SkillBridge API";
export const API_VERSION = "v1";

// User roles
export enum UserRole {
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN",
}

// Booking statuses
export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Database constants
export const DB_TIMEOUT = 10000; // 10 seconds

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const BCRYPT_SALT_ROUNDS = 10;

// Name constraints
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

// Email constraints
export const EMAIL_MAX_LENGTH = 100;

// Tutor profile constraints
export const BIO_MAX_LENGTH = 2000;
export const SUBJECTS_MAX_LENGTH = 500;
export const QUALIFICATIONS_MAX_LENGTH = 1000;
export const HOURLY_RATE_MIN = 5;
export const HOURLY_RATE_MAX = 10000;
export const EXPERIENCE_MIN = 0;
export const EXPERIENCE_MAX = 100;

// Booking constraints
export const BOOKING_SUBJECT_MAX_LENGTH = 100;
export const BOOKING_NOTES_MAX_LENGTH = 500;
export const BOOKING_DURATION_MIN = 1; // minutes
export const BOOKING_DURATION_MAX = 480; // 8 hours
export const BOOKING_PRICE_MIN = 0.01;
export const BOOKING_PRICE_MAX = 10000;

// Review constraints
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

// Category constraints
export const CATEGORY_NAME_MAX_LENGTH = 50;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;

// Availability constraints
export const DAY_OF_WEEK_MIN = 0; // Sunday
export const DAY_OF_WEEK_MAX = 6; // Saturday
export const TIME_FORMAT = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 5;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// JWT
export const JWT_EXPIRY = "7d";
export const JWT_SECRET_MIN_LENGTH = 32;

// CORS
export const CORS_MAX_AGE = 86400; // 24 hours

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  INVALID_EMAIL: "Invalid email format",
  PASSWORD_TOO_WEAK:
    "Password must be at least 8 characters with uppercase, lowercase, and numbers",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "You don't have permission to access this resource",
  RESOURCE_NOT_FOUND: "Resource not found",
  DUPLICATE_RESOURCE: "Resource already exists",
  VALIDATION_FAILED: "Validation failed",
  DATABASE_ERROR: "Database error occurred",
  SERVER_ERROR: "Internal server error",
  ACCOUNT_DISABLED: "Your account has been disabled",
  BOOKING_NOT_FOUND: "Booking not found",
  REVIEW_NOT_FOUND: "Review not found",
  CATEGORY_NOT_FOUND: "Category not found",
  TUTOR_NOT_FOUND: "Tutor not found",
  INVALID_ROLE: "Invalid user role",
  INVALID_STATUS: "Invalid booking status",
};

// Success messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: "User registered successfully",
  LOGIN_SUCCESSFUL: "Login successful",
  USER_UPDATED: "User updated successfully",
  BOOKING_CREATED: "Booking created successfully",
  BOOKING_UPDATED: "Booking updated successfully",
  BOOKING_CANCELLED: "Booking cancelled successfully",
  REVIEW_CREATED: "Review created successfully",
  REVIEW_UPDATED: "Review updated successfully",
  REVIEW_DELETED: "Review deleted successfully",
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",
  AVAILABILITY_CREATED: "Availability created successfully",
  AVAILABILITY_DELETED: "Availability deleted successfully",
};
