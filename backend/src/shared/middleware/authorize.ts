import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/AppError";
import { AuthUser } from "../../../types/express";

export const authorize =
  (...roles: AuthUser["role"][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;

    if (!user || !roles.includes(user.role)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };
