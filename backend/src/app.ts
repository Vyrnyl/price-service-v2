import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes";
import { asyncHandler } from "./shared/handlers/asyncHandler";
import { errorHandler } from "./shared/handlers/errorHandler";
import { authenticate } from "./shared/middleware/authenticate";
import authRoutes from "./modules/auth";
import publicRoutes from "./modules/public";
import { env } from "./config/env";
import { prisma } from "./prisma";

const app = express();
const allowedOrigins = [
  env.CORS_ORIGIN,
  "http://localhost:3000",
  "https://price-service-sandy.vercel.app",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1", authenticate, apiRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "PresyoSerbisyo backend is running" });
});

app.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up" });
    } catch {
      res.status(503).json({ status: "error", database: "down" });
    }
  }),
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;
