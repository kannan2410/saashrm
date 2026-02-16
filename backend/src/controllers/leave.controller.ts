import { Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';
import { AttendanceService } from '../services/attendance.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const leaveService = new LeaveService();
const attendanceService = new AttendanceService();

export class LeaveController {
  async apply(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const leave = await leaveService.apply(employeeId, req.body);
      sendSuccess(res, leave, 'Leave applied', 201);
    } catch (err) {
      next(err);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leave = await leaveService.approve(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.body
      );
      sendSuccess(res, leave, 'Leave updated');
    } catch (err) {
      next(err);
    }
  }

  async getMyLeaves(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const leaves = await leaveService.getByEmployee(employeeId);
      sendSuccess(res, leaves);
    } catch (err) {
      next(err);
    }
  }

  async getPending(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaves = await leaveService.getPending(req.user!.companyId, req.user!.role);
      sendSuccess(res, leaves);
    } catch (err) {
      next(err);
    }
  }

  async getBalances(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const balances = await leaveService.getBalances(employeeId);
      sendSuccess(res, balances);
    } catch (err) {
      next(err);
    }
  }
}
