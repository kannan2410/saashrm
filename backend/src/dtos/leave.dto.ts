import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid start date'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid end date'),
  reason: z.string().min(1, 'Reason is required'),
});

export const approveLeaveSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export type ApplyLeaveDto = z.infer<typeof applyLeaveSchema>;
export type ApproveLeaveDto = z.infer<typeof approveLeaveSchema>;
