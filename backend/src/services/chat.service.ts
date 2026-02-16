import prisma from '../config/database';
import { CreateChannelDto } from '../dtos/chat.dto';
import { NotFoundError, ForbiddenError } from '../utils/app-error';

export class ChatService {
  async createChannel(dto: CreateChannelDto, userId: string, companyId: string) {
    const channel = await prisma.chatChannel.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type || 'PUBLIC',
        companyId,
        createdById: userId,
        members: {
          create: [
            { userId },
            ...(dto.memberIds || []).filter((id) => id !== userId).map((id) => ({ userId: id })),
          ],
        },
      },
      include: { members: { include: { user: { select: { id: true, email: true } } } } },
    });
    return channel;
  }

  async getChannels(userId: string, companyId: string) {
    return prisma.chatChannel.findMany({
      where: {
        companyId,
        type: { not: 'DIRECT' },
        OR: [
          { type: 'PUBLIC' },
          { members: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDirectMessages(userId: string, companyId: string) {
    const dms = await prisma.chatChannel.findMany({
      where: {
        companyId,
        type: 'DIRECT',
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, employee: { select: { fullName: true } } },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return dms.map((dm) => {
      const otherMember = dm.members.find((m) => m.user.id !== userId);
      return {
        ...dm,
        otherUser: otherMember?.user || null,
        lastMessage: dm.messages[0] || null,
      };
    });
  }

  async createOrGetDirectMessage(userId: string, otherUserId: string, companyId: string) {
    // Check if a DM already exists between these two users
    const existing = await prisma.chatChannel.findFirst({
      where: {
        companyId,
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, employee: { select: { fullName: true } } },
            },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
    });

    if (existing) {
      const otherMember = existing.members.find((m) => m.user.id !== userId);
      return { ...existing, otherUser: otherMember?.user || null };
    }

    // Get other user's name for the channel name
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, email: true, employee: { select: { fullName: true } } },
    });
    if (!otherUser) throw new NotFoundError('User');

    const channel = await prisma.chatChannel.create({
      data: {
        name: `dm-${userId}-${otherUserId}`,
        type: 'DIRECT',
        companyId,
        createdById: userId,
        members: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, employee: { select: { fullName: true } } },
            },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
    });

    return { ...channel, otherUser };
  }

  async getMessages(channelId: string, userId: string, cursor?: string, limit = 50) {
    // Verify access
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: { where: { userId } } },
    });
    if (!channel) throw new NotFoundError('Channel');
    if ((channel.type === 'PRIVATE' || channel.type === 'DIRECT') && channel.members.length === 0) {
      throw new ForbiddenError('Not a member of this conversation');
    }

    const where: Record<string, unknown> = { channelId };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    return prisma.chatMessage.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            employee: { select: { fullName: true } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, email: true, employee: { select: { fullName: true } } } },
          },
        },
        files: true,
      },
    });
  }

  async sendMessage(channelId: string, senderId: string, content: string, replyToId?: string) {
    return prisma.chatMessage.create({
      data: { channelId, senderId, content, replyToId: replyToId || null },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            employee: { select: { fullName: true } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, email: true, employee: { select: { fullName: true } } } },
          },
        },
        files: true,
      },
    });
  }

  async getMessageById(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            employee: { select: { fullName: true } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, email: true, employee: { select: { fullName: true } } } },
          },
        },
        files: true,
      },
    });
  }

  async pinMessage(messageId: string) {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundError('Message');
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    });
  }

  async getPinnedMessages(channelId: string) {
    return prisma.chatMessage.findMany({
      where: { channelId, isPinned: true },
      include: {
        sender: {
          select: { id: true, email: true, employee: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFileToMessage(messageId: string, fileData: { url: string; blobName: string; fileName: string; fileSize: number; mimeType: string }) {
    return prisma.chatFile.create({
      data: { messageId, ...fileData },
    });
  }

  async joinChannel(channelId: string, userId: string) {
    const existing = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (existing) return existing;
    return prisma.channelMember.create({ data: { channelId, userId } });
  }

  async addMember(channelId: string, userId: string) {
    const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundError('Channel');

    const existing = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (existing) return existing;

    return prisma.channelMember.create({
      data: { channelId, userId },
      include: {
        user: {
          select: { id: true, email: true, employee: { select: { fullName: true } } },
        },
      },
    });
  }

  async getMembers(channelId: string) {
    return prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: {
          select: { id: true, email: true, employee: { select: { fullName: true } } },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundError('Message');
    if (message.senderId !== userId) throw new ForbiddenError('You can only delete your own messages');
    await prisma.chatMessage.delete({ where: { id: messageId } });
    return { id: messageId, channelId: message.channelId };
  }

  async updateUserStatus(userId: string, status: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { customStatus: status || null },
      select: { id: true, customStatus: true },
    });
  }

  async getUserStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, customStatus: true },
    });
    return user;
  }

  async getCompanyUsers(companyId: string) {
    return prisma.user.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        customStatus: true,
        employee: { select: { fullName: true, department: true } },
      },
      orderBy: { email: 'asc' },
    });
  }

  async getUserChannelIds(userId: string): Promise<string[]> {
    const memberships = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });
    return memberships.map((m) => m.channelId);
  }

  async markChannelRead(channelId: string, userId: string) {
    const now = new Date();
    await prisma.channelMember.updateMany({
      where: { channelId, userId },
      data: { lastReadAt: now },
    });
    return { channelId, userId, lastReadAt: now };
  }

  async getChannelReadStatus(channelId: string) {
    return prisma.channelMember.findMany({
      where: { channelId, lastReadAt: { not: null } },
      select: {
        userId: true,
        lastReadAt: true,
        user: { select: { id: true, email: true, employee: { select: { fullName: true } } } },
      },
    });
  }
}
