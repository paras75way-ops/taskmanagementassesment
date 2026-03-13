import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { protect } from '../common/middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', ActivityController.getActivities);
router.post('/', ActivityController.createActivity);

export default router;
