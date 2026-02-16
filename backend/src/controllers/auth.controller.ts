import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.sendSignupOtp(req.body);
      sendSuccess(res, result, 'OTP sent to your email');
    } catch (err) {
      next(err);
    }
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signup(req.body);
      sendSuccess(res, result, 'Account created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      sendSuccess(res, profile, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }
}
