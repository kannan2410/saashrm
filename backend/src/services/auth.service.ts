import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { JwtPayload } from '../types';
import { LoginDto, SignupDto, VerifySignupDto } from '../dtos/auth.dto';
import { UnauthorizedError, ValidationError } from '../utils/app-error';
import { sendMail } from '../utils/email';
import { setOtp, verifyOtp } from '../utils/otp-store';

export class AuthService {
  async login(dto: LoginDto): Promise<{ token: string; user: Omit<JwtPayload, 'iat' | 'exp'> }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const token = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions);

    return { token, user: payload };
  }

  async sendSignupOtp(dto: SignupDto): Promise<{ message: string }> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ValidationError('Email is already registered');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    setOtp(dto.email, otp, dto);

    await sendMail(
      dto.email,
      'Your SaaS HRM Verification Code',
      `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:8px">${otp}</div>
        <p style="margin-top:16px;color:#6b7280;font-size:14px">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
      </div>`,
    );

    return { message: 'OTP sent to your email' };
  }

  async signup(dto: VerifySignupDto): Promise<{ token: string; user: Omit<JwtPayload, 'iat' | 'exp'> }> {
    const signupData = verifyOtp(dto.email, dto.otp);
    if (!signupData) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const existing = await prisma.user.findUnique({ where: { email: signupData.email } });
    if (existing) {
      throw new ValidationError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(signupData.password, 12);
    const domain = signupData.email.split('@')[1];
    const currentYear = new Date().getFullYear();

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: signupData.companyName, domain },
      });

      const user = await tx.user.create({
        data: {
          email: signupData.email,
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id,
        },
      });

      // Generate unique employee code (globally unique constraint)
      const empCount = await tx.employee.count();
      const employeeCode = `EMP${String(empCount + 1).padStart(5, '0')}`;

      const employee = await tx.employee.create({
        data: {
          employeeCode,
          fullName: signupData.fullName,
          email: signupData.email,
          department: 'Administration',
          designation: 'Administrator',
          dateOfJoining: new Date(),
          salary: 0,
          workLocation: '-',
          companyId: company.id,
          userId: user.id,
        },
      });

      await tx.leaveBalance.createMany({
        data: [
          { employeeId: employee.id, leaveType: 'CASUAL', year: currentYear, total: 12, remaining: 12 },
          { employeeId: employee.id, leaveType: 'SICK', year: currentYear, total: 10, remaining: 10 },
          { employeeId: employee.id, leaveType: 'EARNED', year: currentYear, total: 15, remaining: 15 },
        ],
      });

      const channel = await tx.chatChannel.create({
        data: {
          name: 'General',
          description: 'General discussion channel',
          type: 'PUBLIC',
          companyId: company.id,
          createdById: user.id,
        },
      });

      await tx.channelMember.create({
        data: { channelId: channel.id, userId: user.id },
      });

      return user;
    });

    const payload: JwtPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
      companyId: result.companyId,
    };

    const token = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions);

    return { token, user: payload };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    if (newPassword.length < 6) {
      throw new UnauthorizedError('New password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        customStatus: true,
        company: { select: { id: true, name: true, logo: true } },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            phone: true,
            profilePhoto: true,
            department: true,
            designation: true,
            workLocation: true,
            dateOfJoining: true,
            employmentType: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}
