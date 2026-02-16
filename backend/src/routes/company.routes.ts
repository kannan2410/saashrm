import { Router } from 'express';
import multer from 'multer';
import { CompanyLogoController } from '../controllers/company-logo.controller';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const logoController = new CompanyLogoController();
const companyController = new CompanyController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

// Company info
router.patch('/name', authorize('ADMIN'), companyController.updateName);

// Logo
router.get('/logo', logoController.get);
router.post('/logo', authorize('ADMIN'), upload.single('logo'), logoController.upload);
router.delete('/logo', authorize('ADMIN'), logoController.delete);

export default router;
