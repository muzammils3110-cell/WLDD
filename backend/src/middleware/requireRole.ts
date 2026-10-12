import { NextFunction, Response } from "express";
import { AuthRequest, Role } from "../types";
import { AppError } from "./errorHandler";

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this", 403));
    }
    next();
  };
}