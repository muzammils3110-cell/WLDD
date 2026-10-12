import { AppError } from "../middleware/errorHandler";
import { Role } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupInput(body: any): {
  email: string;
  password: string;
  role: Role;
} {
  const { email, password, role } = body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError("A valid email is required", 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (role !== "brand" && role !== "creator") {
    throw new AppError("Role must be either 'brand' or 'creator'", 400);
  }

  return { email: email.trim().toLowerCase(), password, role };
}

export function validateLoginInput(body: any): {
  email: string;
  password: string;
} {
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  return { email: email.trim().toLowerCase(), password };
}