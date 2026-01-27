export interface ValidationError {
  field: string;
  message: string;
}

export class ValidatorService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?1?\d{9,15}$/;
    return phoneRegex.test(phone);
  }

  static validateHourlyRate(rate: number): boolean {
    return rate >= 0 && rate <= 10000;
  }

  static validateExperience(years: number): boolean {
    return years >= 0 && years <= 100;
  }

  static validateRating(rating: number): boolean {
    return rating >= 1 && rating <= 5;
  }

  static validateDuration(duration: number): boolean {
    return duration > 0 && duration <= 480; // max 8 hours
  }

  static validateFutureDate(date: Date): boolean {
    return date > new Date();
  }

  static getPasswordStrength(password: string): "weak" | "medium" | "strong" {
    let strength: "weak" | "medium" | "strong" = "weak";

    if (password.length >= 8) strength = "medium";
    if (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    ) {
      strength = "strong";
    }

    return strength;
  }
}

export function handleValidationError(error: any, defaultMessage: string) {
  if (error.code === "P2002") {
    return `${error.meta?.target?.[0] || "Field"} already exists`;
  }
  if (error.code === "P2025") {
    return "Record not found";
  }
  return defaultMessage;
}
