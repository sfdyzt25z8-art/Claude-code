import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { API_ROUTES } from "@organizer/shared";

import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import profileRoutes from "./routes/profile";
import aiRoutes from "./routes/ai";
import studentRoutes from "./routes/student";
import businessRoutes from "./routes/business";
import personalRoutes from "./routes/personal";
import calendarRoutes from "./routes/calendar";
import notificationsRoutes from "./routes/notifications";
import statisticsRoutes from "./routes/statistics";
import adminRoutes from "./routes/admin";
import uploadsRoutes from "./routes/uploads";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Serve locally-stored uploads (only relevant when STORAGE_PROVIDER=local, the default).
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use(API_ROUTES.auth, authRoutes);
app.use(API_ROUTES.onboarding, onboardingRoutes);
app.use(API_ROUTES.profile, profileRoutes);
app.use(API_ROUTES.ai, aiRoutes);
app.use(API_ROUTES.student, studentRoutes);
app.use(API_ROUTES.business, businessRoutes);
app.use(API_ROUTES.personal, personalRoutes);
app.use(API_ROUTES.calendar, calendarRoutes);
app.use(API_ROUTES.notifications, notificationsRoutes);
app.use(API_ROUTES.statistics, statisticsRoutes);
app.use(API_ROUTES.admin, adminRoutes);
app.use(API_ROUTES.uploads, uploadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[organizer-backend] listening on port ${PORT} (${process.env.NODE_ENV ?? "development"})`);
});

export default app;
