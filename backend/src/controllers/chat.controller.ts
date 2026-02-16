import { Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { uploadBlob } from '../config/azure-storage';
import { env } from '../config/env';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/app-error';

const chatService = new ChatService();

const MAX_CHAT_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export class ChatController {
  async createChannel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const channel = await chatService.createChannel(req.body, req.user!.userId, req.user!.companyId);
      sendSuccess(res, channel, 'Channel created', 201);
    } catch (err) {
      next(err);
    }
  }

  async getChannels(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const channels = await chatService.getChannels(req.user!.userId, req.user!.companyId);
      sendSuccess(res, channels);
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cursor = req.query.cursor as string | undefined;
      const messages = await chatService.getMessages(req.params.channelId, req.user!.userId, cursor);
      sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  }

  async pinMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await chatService.pinMessage(req.params.messageId);
      sendSuccess(res, message, 'Message pin toggled');
    } catch (err) {
      next(err);
    }
  }

  async getPinnedMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await chatService.getPinnedMessages(req.params.channelId);
      sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  }

  async uploadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) throw new ValidationError('No file uploaded');
      if (file.size > MAX_CHAT_FILE_SIZE) throw new ValidationError('File exceeds 15MB limit');

      const blobName = `${uuid()}-${file.originalname}`;
      const url = await uploadBlob(env.azure.containerChat, blobName, file.buffer, file.mimetype);

      sendSuccess(res, { url, blobName, fileName: file.originalname, fileSize: file.size, mimeType: file.mimetype }, 'File uploaded');
    } catch (err) {
      next(err);
    }
  }

  async joinChannel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await chatService.joinChannel(req.params.channelId, req.user!.userId);
      sendSuccess(res, member, 'Joined channel');
    } catch (err) {
      next(err);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;
      const member = await chatService.addMember(req.params.channelId, userId);
      sendSuccess(res, member, 'Member added', 201);
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await chatService.getMembers(req.params.channelId);
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  }

  async getCompanyUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await chatService.getCompanyUsers(req.user!.companyId);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }

  async getDirectMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dms = await chatService.getDirectMessages(req.user!.userId, req.user!.companyId);
      sendSuccess(res, dms);
    } catch (err) {
      next(err);
    }
  }

  async startDirectMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;
      const dm = await chatService.createOrGetDirectMessage(req.user!.userId, userId, req.user!.companyId);
      sendSuccess(res, dm, 'Direct message ready', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const result = await chatService.updateUserStatus(req.user!.userId, status);
      sendSuccess(res, result, 'Status updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await chatService.deleteMessage(req.params.messageId, req.user!.userId);
      sendSuccess(res, result, 'Message deleted');
    } catch (err) {
      next(err);
    }
  }
}
