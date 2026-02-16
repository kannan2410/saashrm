import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new CalendarController();

router.use(authenticate);

router.get('/month', controller.getMonthData);

export default router;
