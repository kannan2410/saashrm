import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  channelId: z.string().uuid(),
});

export type CreateChannelDto = z.infer<typeof createChannelSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
