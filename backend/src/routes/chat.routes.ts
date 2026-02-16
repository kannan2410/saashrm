import { Router } from 'express';
import multer from 'multer';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChannelSchema } from '../dtos/chat.dto';

const router = Router();
const controller = new ChatController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.use(authenticate);

router.post('/channels', validate(createChannelSchema), controller.createChannel);
router.get('/channels', controller.getChannels);
router.get('/channels/:channelId/messages', controller.getMessages);
router.get('/channels/:channelId/pinned', controller.getPinnedMessages);
router.post('/channels/:channelId/join', controller.joinChannel);
router.get('/channels/:channelId/members', controller.getMembers);
router.post('/channels/:channelId/members', controller.addMember);
router.get('/users', controller.getCompanyUsers);
router.get('/dm', controller.getDirectMessages);
router.post('/dm', controller.startDirectMessage);
router.post('/messages/:messageId/pin', controller.pinMessage);
router.delete('/messages/:messageId', controller.deleteMessage);
router.patch('/status', controller.updateStatus);
router.post('/upload', upload.single('file'), controller.uploadFile);

export default router;
