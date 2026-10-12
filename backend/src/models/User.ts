import { Document, Schema, model } from "mongoose";
import { Role } from "../types";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["brand", "creator"], required: true },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);