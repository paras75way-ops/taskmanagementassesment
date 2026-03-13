import { Request, Response } from 'express';
import { ActivityService } from './activity.service';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { AppError } from '../common/utils/AppError';

export const ActivityController = {
    getActivities: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const boardId = req.query.boardId as string;
        if (!boardId) throw new AppError('boardId query parameter is required', 400);

        const activities = await ActivityService.findByBoardId(boardId);
        res.json(activities);
    }),

    createActivity: asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { boardId, taskId, taskTitle, action, description, snapshot } = req.body;

        if (!boardId || !taskId || !taskTitle || !action || !description) {
            throw new AppError('Missing required fields', 400);
        }

        const activity = await ActivityService.create({
            boardId,
            taskId,
            taskTitle,
            action,
            description,
            snapshot: snapshot || {},
            userId,
        });

        res.status(201).json(activity);
    }),
};
