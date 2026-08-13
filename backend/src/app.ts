import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes";
import { errorHandler } from "./shared/handlers/errorHandler";
import { authenticate } from "./shared/middleware/authenticate";
import authRoutes from "./modules/auth/auth.routes";
import publicRoutes from "./modules/public/public.routes";

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "https://price-service-sandy.vercel.app",
].filter(Boolean) as string[];

const reportsDir = path.resolve(process.cwd(), "reports");

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

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", authenticate, apiRoutes);
app.use("/reports/files", express.static(reportsDir));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "PresyoSerbisyo backend is running" });
});
app.get("/api/test", (_req: Request, res: Response) => {
  console.log("process.env.CORS_ORIGIN =", process.env.CORS_ORIGIN);
  console.log("allowedOrigins =", allowedOrigins);
  res.json({ message: "TEST API" });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
