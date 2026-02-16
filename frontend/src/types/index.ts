export type Role = 'EMPLOYEE' | 'TEAM_LEAD' | 'MANAGER' | 'HR' | 'ADMIN';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DIRECT';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  customStatus?: string | null;
  company: { id: string; name: string; logo?: CompanyLogo | null };
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    phone?: string | null;
    profilePhoto?: string | null;
    department: string;
    designation: string;
    workLocation?: string;
    dateOfJoining?: string;
    employmentType?: EmploymentType;
    status?: EmployeeStatus;
  };
}

export interface CompanyLogo {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  department: string;
  designation: string;
  managerId: string | null;
  manager?: { id: string; fullName: string } | null;
  dateOfJoining: string;
  employmentType: EmploymentType;
  salary: number;
  workLocation: string;
  status: EmployeeStatus;
  user?: { role: Role };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  loginTime: string;
  logoutTime: string | null;
  totalHours: number | null;
}

export interface TodayAttendance {
  sessions: AttendanceRecord[];
  totalWorkedHours: number;
  isCheckedIn: boolean;
  firstLoginTime: string;
  lastLogoutTime: string | null;
  sessionCount: number;
}

// Keep backward compat alias
export type Attendance = AttendanceRecord;

export interface Leave {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  employee?: { id: string; fullName: string; department: string; employeeCode: string };
  approvals: LeaveApproval[];
}

export interface LeaveApproval {
  id: string;
  role: Role;
  action: 'APPROVED' | 'REJECTED';
  comment?: string;
  approver: { email: string; employee?: { fullName: string } };
  createdAt: string;
}

export interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  year: number;
  total: number;
  used: number;
  remaining: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossEarnings: number;
  pf: number;
  tax: number;
  leaveDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  employee?: { fullName: string; employeeCode: string; department: string };
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  _count?: { members: number; messages: number };
  otherUser?: { id: string; email: string; employee?: { fullName: string } } | null;
  lastMessage?: { content: string; createdAt: string } | null;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  content: string;
  isPinned: boolean;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    sender: { id: string; email: string; employee?: { fullName: string } };
  } | null;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    employee?: { fullName: string };
  };
  files?: ChatFile[];
}

export interface ChatFile {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export type HolidayType = 'NATIONAL' | 'COMPANY' | 'REGIONAL';

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string | null;
}

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
