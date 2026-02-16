import { Response, NextFunction } from 'express';
import { PayrollService } from '../services/payroll.service';
import { AttendanceService } from '../services/attendance.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const payrollService = new PayrollService();
const attendanceService = new AttendanceService();

export class PayrollController {
  async generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payroll = await payrollService.generate(req.body);
      sendSuccess(res, payroll, 'Payroll generated', 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyPayrolls(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = await attendanceService.getEmployeeIdByUserId(req.user!.userId);
      const payrolls = await payrollService.getByEmployee(employeeId);
      sendSuccess(res, payrolls);
    } catch (err) {
      next(err);
    }
  }

  async getSlip(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const slip = await payrollService.getSlip(req.params.id, req.user!.companyId);
      sendSuccess(res, slip);
    } catch (err) {
      next(err);
    }
  }

  async downloadPdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const buffer = await payrollService.generatePdf(req.params.id, req.user!.companyId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${req.params.id}.pdf`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const payrolls = await payrollService.getAll(req.user!.companyId, month, year);
      sendSuccess(res, payrolls);
    } catch (err) {
      next(err);
    }
  }
}
