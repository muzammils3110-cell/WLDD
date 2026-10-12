import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthPayload, AuthRequest } from "../types";
import { AppError } from "./errorHandler";

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const token = header.slice("Bearer ".length);
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}