import { Router } from 'express';
import { TaskController } from './task.controller';
import { protect } from '../common/middleware/auth.middleware';
// import { requireBoardAccess } from '../common/middleware/boardAuth.middleware';
import { createTaskValidation, updateTaskValidation } from './task.validation';
import { validateRequest } from '../common/middleware/validate.middleware';
// import { taskLimiter } from '../common/middleware/rateLimiter.middleware';

const router = Router();

router.use(protect);
// router.use(taskLimiter);

router.get('/', TaskController.getTasks);
router.post('/', createTaskValidation, validateRequest,TaskController.createTask);
router.patch('/:id', updateTaskValidation, validateRequest,TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;