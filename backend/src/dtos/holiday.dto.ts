import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  type: z.enum(['NATIONAL', 'COMPANY', 'REGIONAL']).default('COMPANY'),
  description: z.string().max(500).optional(),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date').optional(),
  type: z.enum(['NATIONAL', 'COMPANY', 'REGIONAL']).optional(),
  description: z.string().max(500).optional(),
});

export type CreateHolidayDto = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayDto = z.infer<typeof updateHolidaySchema>;
