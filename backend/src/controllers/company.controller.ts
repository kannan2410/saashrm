import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/app-error';

export class CompanyController {
  async updateName(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Company name is required');
      }
      if (name.trim().length > 200) {
        throw new ValidationError('Company name must be 200 characters or less');
      }

      const company = await prisma.company.update({
        where: { id: req.user!.companyId },
        data: { name: name.trim() },
      });
      sendSuccess(res, company, 'Company name updated');
    } catch (err) {
      next(err);
    }
  }
}
