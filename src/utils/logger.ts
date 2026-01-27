// Error logging utilities for backend
import { Response } from "express";

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export class ErrorLogger {
  static log(
    error: any,
    context: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  ) {
    const timestamp = new Date().toISOString();
    const message = error?.message || JSON.stringify(error);

    console.log(
      `[${timestamp}] [${severity}] [${context}] ${message}`,
    );

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.
  }

  static sendErrorResponse(
    res: Response,
    statusCode: number,
    message: string,
    details?: any,
  ) {
    const errorResponse: any = {
      error: message,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "development" && details) {
      errorResponse.details = details;
    }

    res.status(statusCode).json(errorResponse);
  }

  static handleValidationError(error: any): string {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return `${field} already exists`;
    }
    if (error.code === "P2025") {
      return "Record not found";
    }
    if (error.code === "P2000") {
      return "Value too long for database field";
    }
    return "Database error occurred";
  }

  static isAuthError(error: any): boolean {
    return error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError";
  }

  static isDatabaseError(error: any): boolean {
    return error?.code?.startsWith("P");
  }
}
