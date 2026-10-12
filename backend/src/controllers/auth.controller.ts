import bcrypt from "bcryptjs";
import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { IUser, User } from "../models/User";
import { AuthPayload, AuthRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateLoginInput, validateSignupInput } from "../utils/validators";

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

function publicUser(user: IUser) {
  return { id: String(user._id), email: user.email, role: user.role };
}

export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role } = validateSignupInput(req.body);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email is already registered", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  let user: IUser;
  try {
    user = await User.create({ email, passwordHash, role });
  } catch (err: any) {
    // Two simultaneous signups with the same email: the unique index catches it
    if (err?.code === 11000) throw new AppError("Email is already registered", 409);
    throw err;
  }

  const token = signToken({ userId: String(user._id), role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = validateLoginInput(req.body);

  // passwordHash is excluded by default, so select it explicitly
  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) throw new AppError("Invalid email or password", 401);

  const token = signToken({ userId: String(user._id), role: user.role });
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new AppError("User not found", 404);
  res.json({ user: publicUser(user) });
});