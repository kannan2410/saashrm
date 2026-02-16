import prisma from '../config/database';

export type CalendarDayStatus =
  | 'present'
  | 'absent'
  | 'leave_approved'
  | 'leave_pending'
  | 'holiday'
  | 'weekend'
  | 'future';

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  status: CalendarDayStatus;
  attendance?: { loginTime: string; logoutTime: string | null; totalHours: number | null };
  leave?: { id: string; leaveType: string; status: string };
  holiday?: { id: string; name: string; type: string };
}

export interface CalendarMonthData {
  month: number;
  year: number;
  days: CalendarDay[];
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalLeaves: number;
    totalHolidays: number;
    totalWeekends: number;
  };
}

export class CalendarService {
  async getMonthData(employeeId: string, companyId: string, month: number, year: number): Promise<CalendarMonthData> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Get employee's date of joining
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { dateOfJoining: true },
    });
    const jd = employee?.dateOfJoining ? new Date(employee.dateOfJoining) : null;
    const joiningDate = jd ? new Date(Date.UTC(jd.getUTCFullYear(), jd.getUTCMonth(), jd.getUTCDate())) : null;

    // Fetch attendance, leaves, and holidays in parallel
    const [attendances, leaves, holidays] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId, date: { gte: startDate, lte: endDate } },
        orderBy: { loginTime: 'asc' },
      }),
      prisma.leave.findMany({
        where: {
          employeeId,
          status: { in: ['PENDING', 'APPROVED'] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      }),
      prisma.holiday.findMany({
        where: { companyId, date: { gte: startDate, lte: endDate } },
      }),
    ]);

    // Build lookup maps
    const attendanceMap = new Map<string, typeof attendances>();
    for (const a of attendances) {
      const key = a.date.toISOString().split('T')[0];
      if (!attendanceMap.has(key)) attendanceMap.set(key, []);
      attendanceMap.get(key)!.push(a);
    }

    const holidayMap = new Map<string, typeof holidays[0]>();
    for (const h of holidays) {
      holidayMap.set(h.date.toISOString().split('T')[0], h);
    }

    // Build leave date map (a leave can span multiple days)
    const leaveDateMap = new Map<string, typeof leaves[0]>();
    for (const leave of leaves) {
      const ls = new Date(leave.startDate);
      const le = new Date(leave.endDate);
      for (let d = new Date(ls); d <= le; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        // Only map if within our month range
        if (d >= startDate && d <= endDate) {
          leaveDateMap.set(key, leave);
        }
      }
    }

    const days: CalendarDay[] = [];
    let totalPresent = 0, totalAbsent = 0, totalLeaves = 0, totalHolidays = 0, totalWeekends = 0;

    const daysInMonth = endDate.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const dateKey = dateObj.toISOString().split('T')[0];
      const dayOfWeek = dateObj.getUTCDay(); // 0=Sun, 6=Sat

      const calDay: CalendarDay = { date: dateKey, dayOfWeek, status: 'absent' };

      // Future days
      if (dateObj > today) {
        calDay.status = 'future';
        days.push(calDay);
        continue;
      }

      // Before joining date
      if (joiningDate && dateObj < joiningDate) {
        calDay.status = 'future';
        days.push(calDay);
        continue;
      }

      // Weekend (Saturday/Sunday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        calDay.status = 'weekend';
        totalWeekends++;
        days.push(calDay);
        continue;
      }

      // Holiday
      const holiday = holidayMap.get(dateKey);
      if (holiday) {
        calDay.status = 'holiday';
        calDay.holiday = { id: holiday.id, name: holiday.name, type: holiday.type };
        totalHolidays++;
        days.push(calDay);
        continue;
      }

      // Leave
      const leave = leaveDateMap.get(dateKey);
      if (leave) {
        calDay.status = leave.status === 'APPROVED' ? 'leave_approved' : 'leave_pending';
        calDay.leave = { id: leave.id, leaveType: leave.leaveType, status: leave.status };
        totalLeaves++;
        days.push(calDay);
        continue;
      }

      // Attendance
      const dayAttendance = attendanceMap.get(dateKey);
      if (dayAttendance && dayAttendance.length > 0) {
        const firstSession = dayAttendance[0];
        const totalHours = dayAttendance.reduce((sum, a) => sum + (a.totalHours ? Number(a.totalHours) : 0), 0);
        calDay.status = 'present';
        calDay.attendance = {
          loginTime: firstSession.loginTime.toISOString(),
          logoutTime: dayAttendance[dayAttendance.length - 1].logoutTime?.toISOString() || null,
          totalHours: totalHours > 0 ? Number(totalHours.toFixed(2)) : null,
        };
        totalPresent++;
        days.push(calDay);
        continue;
      }

      // Absent (no attendance, no leave, no holiday, not weekend, not future)
      totalAbsent++;
      days.push(calDay);
    }

    return {
      month,
      year,
      days,
      summary: { totalPresent, totalAbsent, totalLeaves, totalHolidays, totalWeekends },
    };
  }
}
