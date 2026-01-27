// Request validation middleware for the backend
import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../utils/response";

export interface ValidationRule {
  [key: string]: {
    type: "string" | "number" | "email" | "boolean" | "array";
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    enum?: any[];
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export function validateRequest(rules: ValidationRule) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      const actualType = Array.isArray(value)
        ? "array"
        : typeof value === "number"
          ? "number"
          : typeof value === "string"
            ? "string"
            : typeof value === "boolean"
              ? "boolean"
              : "unknown";

      if (rule.type === "email" && !isValidEmail(value)) {
        errors[field] = `${field} must be a valid email`;
      } else if (rule.type === "number" && actualType !== "number") {
        errors[field] = `${field} must be a number`;
      } else if (rule.type === "string" && actualType !== "string") {
        errors[field] = `${field} must be a string`;
      } else if (rule.type === "boolean" && actualType !== "boolean") {
        errors[field] = `${field} must be a boolean`;
      } else if (rule.type === "array" && actualType !== "array") {
        errors[field] = `${field} must be an array`;
      }

      // Check min/max for numbers
      if (rule.type === "number" && actualType === "number") {
        if (rule.min !== undefined && value < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors[field] = `${field} must be at most ${rule.max}`;
        }
      }

      // Check minLength/maxLength for strings
      if (rule.type === "string" && actualType === "string") {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        }
      }

      // Check enum
      if (rule.enum && !rule.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rule.enum.join(", ")}`;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
      }

      // Check custom validator
      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          errors[field] = typeof result === "string" ? result : `${field} is invalid`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return ResponseHelper.badRequest(res, "Validation failed", errors);
    }

    next();
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
