import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types/express";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError";
import { asyncHandler } from "../handlers/asyncHandler";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req) ?? req.cookies.accessToken;

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

    req.user = payload;

    next();
  },
);