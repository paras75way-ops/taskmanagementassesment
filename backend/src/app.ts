import express from "express";
import authRoutes from "./auth/auth.routes";
import TaskRoutes from "./task/task.routes";
import boardRoutes from "./board/board.routes";
import activityRoutes from "./activity/activity.routes";
import cookieParser from "cookie-parser";
import cors from 'cors'
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./common/middleware/error.middleware";
const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
)
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/activities", activityRoutes);

app.use(errorHandler);

export default app;