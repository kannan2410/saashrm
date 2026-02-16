import { Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendPaginated } from '../utils/response';

const employeeService = new EmployeeService();

export class EmployeeController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { department, status, page, limit } = req.query;
      const result = await employeeService.getAll(req.user!.companyId, {
        department: department as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendPaginated(res, result.employees, result.total, result.page, result.limit);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getById(req.params.id, req.user!.companyId);
      sendSuccess(res, employee);
    } catch (err) {
      next(err);
    }
  }

  async getOwnProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getByUserId(req.user!.userId);
      sendSuccess(res, employee);
    } catch (err) {
      next(err);
    }
  }

  async updateOwnProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.updateOwnProfile(req.user!.userId, req.body);
      sendSuccess(res, employee, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.create(req.body, req.user!.companyId);
      sendSuccess(res, employee, 'Employee created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.update(req.params.id, req.body, req.user!.companyId);
      sendSuccess(res, employee, 'Employee updated');
    } catch (err) {
      next(err);
    }
  }

  async getOrgTree(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await employeeService.getOrgTree(req.user!.companyId);
      sendSuccess(res, tree);
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const result = await employeeService.uploadPhoto(req.user!.userId, req.file);
      sendSuccess(res, result, 'Photo uploaded');
    } catch (err) {
      next(err);
    }
  }

  async deletePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await employeeService.deletePhoto(req.user!.userId);
      sendSuccess(res, result, 'Photo removed');
    } catch (err) {
      next(err);
    }
  }

  async getDepartments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await employeeService.getDepartments(req.user!.companyId);
      sendSuccess(res, departments);
    } catch (err) {
      next(err);
    }
  }
}
