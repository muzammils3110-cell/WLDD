import { AppError } from "../middleware/errorHandler";
import { Platform } from "../types";

const HOSTS: Record<Platform, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
};

export function validateObjectId(id: unknown, label = "id"): string {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return id;
}

export function normalizePostUrl(raw: unknown, platform: Platform): string {
  if (typeof raw !== "string") {
    throw new AppError("postUrl is required", 400);
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new AppError("postUrl must be a valid URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("postUrl must be an http(s) link", 400);
  }

  const host = url.hostname.toLowerCase();
  if (!HOSTS[platform].includes(host)) {
    throw new AppError(`postUrl must be a ${platform} link for this campaign`, 400);
  }

  const canonicalHost = host.replace(/^(www\.|m\.)/, "");
  const path = url.pathname.replace(/\/+$/, "");

  if (path.length === 0) {
    throw new AppError("postUrl must point to a specific post", 400);
  }

  // YouTube watch links identify the video through the ?v= parameter
  if (canonicalHost === "youtube.com" && path === "/watch") {
    const v = url.searchParams.get("v");
    if (!v) throw new AppError("YouTube link is missing the video id", 400);
    return `https://youtube.com/watch?v=${v}`;
  }

  return `https://${canonicalHost}${path}`;
}

export function validateViewsInput(body: any): number {
  const views = body?.views;
  if (!Number.isSafeInteger(views) || views < 0) {
    throw new AppError("views must be a non-negative whole number", 400);
  }
  return views;
}