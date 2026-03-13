import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { protect } from '../common/middleware/auth.middleware';
import { getActivitiesValidation, createActivityValidation } from './activity.validation';
import { validateRequest } from '../common/middleware/validate.middleware';

const router = Router();

router.use(protect);

router.get('/', getActivitiesValidation, validateRequest, ActivityController.getActivities);
router.post('/', createActivityValidation, validateRequest, ActivityController.createActivity);

export default router;
