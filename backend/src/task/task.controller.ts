import { Request, Response } from "express";
import { TaskService } from "./task.service";
import { BoardService } from "../board/board.service";
import { AuthRequest } from "../common/middleware/auth.middleware";
import { TaskInput } from "./task.types";
import { asyncHandler } from "../common/utils/asyncHandler";
import { AppError } from "../common/utils/AppError";
import { detectCycle } from "../common/utils/blockdependency/dependency.utils";

export const TaskController = {
  getTasks: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const boardId = req.query.boardId as string;
    if (!boardId) throw new AppError("Board ID is required", 400);

    const tasks = await TaskService.findByBoardId(boardId);
    res.json(tasks);
  }),

  createTask: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = req.body as TaskInput;

  
    const board = await BoardService.findById(body.boardId, userId);
    if (!board) throw new AppError("Board not found", 404);

    const task = await TaskService.create(userId, body);
    res.status(201).json(task);
  }),

  updateTask: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body as Partial<TaskInput>;

    if (body.boardId) {
      const board = await BoardService.findById(body.boardId, userId);
      if (!board) throw new AppError("Target board not found", 404);
    }

    if (body.blockedBy && body.blockedBy.length > 0) {
      const hasCycle = await detectCycle(taskId, body.blockedBy);
      if (hasCycle) {
        throw new AppError("Circular dependency detected. This change would create a cycle.", 400);
      }
    }

    const task = await TaskService.updateOne(taskId, body);
    if (!task) throw new AppError("Task not found", 404);

    if (body.status === "done") {
      await TaskService.removeBlockerFromAll(taskId);
    }

    res.json(task);
  }),

  deleteTask: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await TaskService.removeBlockerFromAll(taskId);

    const task = await TaskService.deleteOne(taskId);
    if (!task) throw new AppError("Task not found", 404);
    res.json({ message: "Task deleted" });
  }),
};