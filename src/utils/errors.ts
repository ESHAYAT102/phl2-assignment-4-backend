import { Response } from "express";

export interface AppError {
  statusCode: number;
  message: string;
  details?: any;
}

export class AppException extends Error implements AppError {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppException.prototype);
  }
}

export function sendErrorResponse(res: Response, error: any) {
  if (error instanceof AppException) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  console.error("Unexpected error:", error);
  res.status(500).json({
    error: "Internal server error",
  });
}

export const errorMessages = {
  UNAUTHORIZED: "You are not authorized to perform this action",
  FORBIDDEN: "Access forbidden",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  DUPLICATE_ENTRY: "This entry already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "Your account has been disabled",
  SESSION_EXPIRED: "Your session has expired",
  SERVER_ERROR: "Internal server error",
};
