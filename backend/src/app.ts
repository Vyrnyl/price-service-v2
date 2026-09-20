import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import apiRoutes from "./routes";
import { asyncHandler } from "./shared/handlers/asyncHandler";
import { errorHandler } from "./shared/handlers/errorHandler";
import { authenticate } from "./shared/middleware/authenticate";
import authRoutes from "./modules/auth";
import publicRoutes from "./modules/public";
import { env } from "./config/env";
import { prisma } from "./prisma";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

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

// Liveness only — deliberately does not touch the database. Render polls this
// path (render.yaml healthCheckPath) and an uptime cron hits it every 10 minutes;
// querying here wakes the Neon compute on every probe and keeps it billable for
// its full idle timeout, which burns the free tier's 100 CU-hours. Use
// /health/db when connectivity itself needs checking.
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get(
  "/health/db",
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
