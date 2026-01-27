// API Response standardization utilities
import { Response } from "express";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  statusCode: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    message?: string,
  ) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string,
    statusCode: number = 400,
    data?: any,
  ) {
    const response: ApiResponse<any> = {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString(),
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode: number = 200,
  ) {
    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = "Created successfully") {
    return this.success(res, data, 201, message);
  }

  static noContent(res: Response, message: string = "No content") {
    return res.status(204).json({ message });
  }

  static badRequest(res: Response, error: string) {
    return this.error(res, error, 400);
  }

  static unauthorized(res: Response, error: string = "Unauthorized") {
    return this.error(res, error, 401);
  }

  static forbidden(res: Response, error: string = "Forbidden") {
    return this.error(res, error, 403);
  }

  static notFound(res: Response, error: string = "Not found") {
    return this.error(res, error, 404);
  }

  static conflict(res: Response, error: string = "Conflict") {
    return this.error(res, error, 409);
  }

  static internalError(res: Response, error: string = "Internal server error") {
    return this.error(res, error, 500);
  }
}
