import { Router } from 'express';
import { BoardController } from './board.controller';
import { protect } from '../common/middleware/auth.middleware';
import { requireBoardAccess } from '../common/middleware/boardAuth.middleware';
import { createBoardValidation, updateBoardValidation } from './board.validation';
import { validateRequest } from '../common/middleware/validate.middleware';
// import { authLimiter } from '../common/middleware/rateLimiter.middleware';

const router = Router();

router.use(protect);
 

router.get('/', BoardController.getBoards);
router.post('/', createBoardValidation, validateRequest, BoardController.createBoard);

router.patch('/:id', updateBoardValidation, validateRequest, requireBoardAccess('admin'), BoardController.updateBoard);
router.delete('/:id', requireBoardAccess('admin'), BoardController.deleteBoard);

// Member routes
router.get('/:id/members', BoardController.getMembers);
router.post('/:id/members', requireBoardAccess('admin'), BoardController.addMember);
router.delete('/:id/members/:userId', requireBoardAccess('admin'), BoardController.removeMember);

export default router;
