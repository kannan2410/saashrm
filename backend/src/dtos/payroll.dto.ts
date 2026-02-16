import { z } from 'zod';

export const generatePayrollSchema = z.object({
  employeeId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  allowances: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
});

export type GeneratePayrollDto = z.infer<typeof generatePayrollSchema>;
