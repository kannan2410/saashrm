import { Response, NextFunction } from 'express';
import { HolidayService } from '../services/holiday.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const holidayService = new HolidayService();

export class HolidayController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const holiday = await holidayService.create(req.user!.companyId, req.body);
      sendSuccess(res, holiday, 'Holiday created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const holiday = await holidayService.update(req.params.id, req.user!.companyId, req.body);
      sendSuccess(res, holiday, 'Holiday updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await holidayService.delete(req.params.id, req.user!.companyId);
      sendSuccess(res, null, 'Holiday deleted');
    } catch (err) {
      next(err);
    }
  }

  async getByYear(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const holidays = await holidayService.getByYear(req.user!.companyId, year);
      sendSuccess(res, holidays);
    } catch (err) {
      next(err);
    }
  }
}
