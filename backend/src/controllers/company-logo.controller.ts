import { Response, NextFunction } from 'express';
import { CompanyLogoService } from '../services/company-logo.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/app-error';

const logoService = new CompanyLogoService();

export class CompanyLogoController {
  async upload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new ValidationError('No file uploaded');
      const logo = await logoService.upload(req.user!.companyId, req.file);
      sendSuccess(res, logo, 'Logo uploaded', 201);
    } catch (err) {
      next(err);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logo = await logoService.get(req.user!.companyId);
      sendSuccess(res, logo);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await logoService.delete(req.user!.companyId);
      sendSuccess(res, null, 'Logo deleted');
    } catch (err) {
      next(err);
    }
  }
}
