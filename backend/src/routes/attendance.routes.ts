import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new AttendanceController();

router.use(authenticate);

router.post('/check-in', controller.checkIn);
router.post('/check-out', controller.checkOut);
router.get('/today', controller.getTodayStatus);
router.get('/monthly', controller.getMonthlyReport);
router.get('/monthly/:employeeId', controller.getMonthlyReport);

export default router;
