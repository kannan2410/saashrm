import prisma from '../config/database';
import { ValidationError, NotFoundError } from '../utils/app-error';
import { Decimal } from '@prisma/client/runtime/library';

export class AttendanceService {
  private getUTCToday(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  async checkIn(employeeId: string) {
    // Check if there's already an open session (checked in but not out)
    const today = this.getUTCToday();
    const openSession = await prisma.attendance.findFirst({
      where: { employeeId, date: today, logoutTime: null },
    });

    if (openSession) {
      throw new ValidationError('You have an open session. Please check out first.');
    }

    return prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        loginTime: new Date(),
      },
    });
  }

  async checkOut(employeeId: string) {
    const today = this.getUTCToday();

    // Find the latest open session for today
    const openSession = await prisma.attendance.findFirst({
      where: { employeeId, date: today, logoutTime: null },
      orderBy: { loginTime: 'desc' },
    });

    if (!openSession) {
      throw new ValidationError('No open check-in session found');
    }

    const logoutTime = new Date();
    const diffMs = logoutTime.getTime() - openSession.loginTime.getTime();
    const totalHours = new Decimal((diffMs / (1000 * 60 * 60)).toFixed(2));

    return prisma.attendance.update({
      where: { id: openSession.id },
      data: { logoutTime, totalHours },
    });
  }

  async getTodayStatus(employeeId: string) {
    const today = this.getUTCToday();

    // Get all sessions for today
    const sessions = await prisma.attendance.findMany({
      where: { employeeId, date: today },
      orderBy: { loginTime: 'asc' },
    });

    if (sessions.length === 0) return null;

    // Calculate total working hours from all completed sessions
    const totalWorkedHours = sessions.reduce((sum, s) => {
      return sum + (s.totalHours ? Number(s.totalHours) : 0);
    }, 0);

    // Check if there's a currently open session
    const openSession = sessions.find((s) => !s.logoutTime);

    return {
      sessions,
      totalWorkedHours: Number(totalWorkedHours.toFixed(2)),
      isCheckedIn: !!openSession,
      firstLoginTime: sessions[0].loginTime,
      lastLogoutTime: sessions.filter((s) => s.logoutTime).pop()?.logoutTime || null,
      sessionCount: sessions.length,
    };
  }

  async getMonthlyReport(employeeId: string, month: number, year: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { loginTime: 'asc' },
    });

    // Group by date and sum hours
    const dailyMap = new Map<string, { records: typeof records; totalHours: number }>();
    for (const record of records) {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { records: [], totalHours: 0 });
      }
      const entry = dailyMap.get(dateKey)!;
      entry.records.push(record);
      entry.totalHours += record.totalHours ? Number(record.totalHours) : 0;
    }

    const totalDays = dailyMap.size;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours ? Number(r.totalHours) : 0), 0);

    return { records, summary: { totalDays, totalHours: totalHours.toFixed(2), month, year } };
  }

  async getEmployeeIdByUserId(userId: string): Promise<string> {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Employee');
    return employee.id;
  }

  async verifyEmployeeCompany(employeeId: string, companyId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { companyId: true },
    });
    if (!employee || employee.companyId !== companyId) throw new NotFoundError('Employee');
  }
}
