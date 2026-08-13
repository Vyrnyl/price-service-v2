import { Request, Response } from "express";
import { asyncHandler } from "../../shared/handlers/asyncHandler";
import { authService } from "./auth.service";
import { loginSchema } from "./auth.schema";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = loginSchema.parse(req.body);
    const result = await authService.login(validatedBody);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: "Login successful",
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const authUser = req.user as
      | {
          userId: string;
          email: string;
          role: "ADMIN" | "OFFICER";
        }
      | undefined;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: authUser.userId,
        email: authUser.email,
        role: authUser.role,
      },
      message: "Authenticated user fetched",
    });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }),
};
