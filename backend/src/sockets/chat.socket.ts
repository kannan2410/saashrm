import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';
import { ChatService } from '../services/chat.service';
import logger from '../utils/logger';

const chatService = new ChatService();

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

export function initChatSocket(io: Server): void {
  // Auth middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    logger.info(`User connected: ${user.email}`);

    // Track online presence
    if (!onlineUsers.has(user.userId)) {
      onlineUsers.set(user.userId, new Set());
    }
    onlineUsers.get(user.userId)!.add(socket.id);

    // Broadcast online status to company
    socket.join(`company:${user.companyId}`);
    io.to(`company:${user.companyId}`).emit('presence:online', { userId: user.userId });

    // Send current online users list to the newly connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('presence:list', onlineUserIds);

    // Auto-join all user's channel rooms so they receive message:new events
    try {
      const channelIds = await chatService.getUserChannelIds(user.userId);
      for (const channelId of channelIds) {
        socket.join(`channel:${channelId}`);
      }
    } catch (err) {
      logger.error('Failed to auto-join channels', err);
    }

    // Join a channel room
    socket.on('join:channel', async (channelId: string) => {
      try {
        await chatService.joinChannel(channelId, user.userId);
        socket.join(`channel:${channelId}`);
        socket.to(`channel:${channelId}`).emit('user:joined', {
          userId: user.userId,
          channelId,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Leave a channel room
    socket.on('leave:channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    // Send message
    socket.on('message:send', async (data: { channelId: string; content: string; replyToId?: string; fileData?: { url: string; blobName: string; fileName: string; fileSize: number; mimeType: string } }) => {
      try {
        let message = await chatService.sendMessage(data.channelId, user.userId, data.content, data.replyToId);

        if (data.fileData) {
          await chatService.addFileToMessage(message.id, data.fileData);
          const updated = await chatService.getMessageById(message.id);
          if (updated) message = updated;
        }

        io.to(`channel:${data.channelId}`).emit('message:new', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Delete message
    socket.on('message:delete', async (messageId: string) => {
      try {
        const result = await chatService.deleteMessage(messageId, user.userId);
        io.to(`channel:${result.channelId}`).emit('message:deleted', { id: result.id });
      } catch (err) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Pin message
    socket.on('message:pin', async (messageId: string) => {
      try {
        const message = await chatService.pinMessage(messageId);
        io.to(`channel:${message.channelId}`).emit('message:pinned', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to pin message' });
      }
    });

    // Update custom status
    socket.on('status:update', async (status: string) => {
      try {
        const result = await chatService.updateUserStatus(user.userId, status);
        io.to(`company:${user.companyId}`).emit('status:changed', {
          userId: user.userId,
          customStatus: result.customStatus,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Mark channel as read
    socket.on('message:read', async (channelId: string) => {
      try {
        const result = await chatService.markChannelRead(channelId, user.userId);
        // Notify the channel that this user has seen messages
        socket.to(`channel:${channelId}`).emit('message:seen', {
          channelId,
          userId: user.userId,
          lastReadAt: result.lastReadAt,
        });
      } catch (err) {
        logger.error('Failed to mark channel read', err);
      }
    });

    // Typing indicator
    socket.on('typing:start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:start', { userId: user.userId });
    });

    socket.on('typing:stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:stop', { userId: user.userId });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.email}`);

      // Remove socket from online tracking
      const userSockets = onlineUsers.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user.userId);
          // Broadcast offline status
          io.to(`company:${user.companyId}`).emit('presence:offline', { userId: user.userId });
        }
      }
    });
  });
}
