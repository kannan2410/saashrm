import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, signupSchema, verifySignupSchema } from '../dtos/auth.dto';

const router = Router();
const controller = new AuthController();

router.post('/send-otp', validate(signupSchema), controller.sendOtp);
router.post('/signup', validate(verifySignupSchema), controller.signup);
router.post('/login', validate(loginSchema), controller.login);
router.get('/profile', authenticate, controller.getProfile);
router.post('/change-password', authenticate, controller.changePassword);

export default router;
