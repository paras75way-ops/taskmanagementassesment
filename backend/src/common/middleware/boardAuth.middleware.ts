import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { BoardMember } from '../../board/board.models';
import { Task } from '../../task/task.models';
import { AppError } from '../utils/AppError';

export const requireBoardAccess = (requiredRole?: 'admin' | 'member') => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;

            if (!userId) {
                return next(new AppError('Unauthorized', 401));
            }

            let boardId = req.params.boardId || req.params.id || req.body.boardId || req.query.boardId;

            // Special handling for routes like /api/tasks/:id where :id is the taskId
            const isTaskRoute = req.baseUrl.includes('/tasks') && !!req.params.id;
            if (isTaskRoute) {
                const taskId = req.params.id;
                const task = await Task.findById(taskId).exec();
                if (!task) {
                    return next(new AppError('Task not found', 404));
                }
                boardId = task.boardId;
            }

            if (!boardId) {
                // Some board creation routes or task queries without boardId might trigger this,
                // but those routes shouldn't use this middleware or should provide boardId.
                return next(new AppError('Board ID is required for access control', 400));
            }

            const membership = await BoardMember.findOne({ boardId, userId }).exec();

            if (!membership) {
                return next(new AppError('Forbidden: You are not a member of this board', 403));
            }

            if (requiredRole === 'admin' && membership.role !== 'admin') {
                return next(new AppError('Forbidden: Requires admin privileges', 403));
            }

            // Proceed
            next();
        } catch (err) {
            next(err);
        }
    };
};
