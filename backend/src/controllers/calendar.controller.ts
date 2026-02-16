import { Response, NextFunction } from 'express';
import { CalendarService } from '../services/calendar.service';
import { AttendanceService } from '../services/attendance.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const calendarService = new CalendarService();
const attendanceService = new AttendanceService();

export class CalendarController {
  async getMonthData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const year = parseInt(req.query.year as string) || now.getFullYear();

      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const data = await calendarService.getMonthData(employeeId, req.user!.companyId, month, year);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}
