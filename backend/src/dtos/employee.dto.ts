import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(20),
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(6),
  department: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  managerId: z.string().uuid().optional().nullable(),
  dateOfJoining: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  salary: z.number().positive(),
  workLocation: z.string().min(1).max(200),
  role: z.enum(['EMPLOYEE', 'TEAM_LEAD', 'MANAGER', 'HR', 'ADMIN']).default('EMPLOYEE'),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  department: z.string().min(1).max(100).optional(),
  designation: z.string().min(1).max(100).optional(),
  managerId: z.string().uuid().optional().nullable(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  salary: z.number().positive().optional(),
  workLocation: z.string().min(1).max(200).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
