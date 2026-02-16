import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import attendanceRoutes from './attendance.routes';
import leaveRoutes from './leave.routes';
import payrollRoutes from './payroll.routes';
import chatRoutes from './chat.routes';
import companyRoutes from './company.routes';
import holidayRoutes from './holiday.routes';
import calendarRoutes from './calendar.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/chat', chatRoutes);
router.use('/company', companyRoutes);
router.use('/holidays', holidayRoutes);
router.use('/calendar', calendarRoutes);

export default router;
