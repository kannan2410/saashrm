import { Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const attendanceService = new AttendanceService();

export class AttendanceController {
  async checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const attendance = await attendanceService.checkIn(employeeId);
      sendSuccess(res, attendance, 'Checked in successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const attendance = await attendanceService.checkOut(employeeId);
      sendSuccess(res, attendance, 'Checked out successfully');
    } catch (err) {
      next(err);
    }
  }

  async getTodayStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const status = await attendanceService.getTodayStatus(employeeId);
      sendSuccess(res, status);
    } catch (err) {
      next(err);
    }
  }

  async getMonthlyReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let employeeId: string;
      if (req.params.employeeId) {
        // Verify the requested employee belongs to the same company
        await attendanceService.verifyEmployeeCompany(req.params.employeeId, req.user!.companyId);
        employeeId = req.params.employeeId;
      } else {
        employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      }
      const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
      const report = await attendanceService.getMonthlyReport(employeeId, month, year);
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  }
}
