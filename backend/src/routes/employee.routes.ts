import { Router } from 'express';
import multer from 'multer';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../dtos/employee.dto';

const router = Router();
const controller = new EmployeeController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/me', controller.getOwnProfile);
router.patch('/me', controller.updateOwnProfile);
router.post('/me/photo', upload.single('photo'), controller.uploadPhoto);
router.delete('/me/photo', controller.deletePhoto);
router.get('/departments', controller.getDepartments);
router.get('/org-tree', controller.getOrgTree);
router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), controller.getAll);
router.get('/:id', authorize('ADMIN', 'HR', 'MANAGER'), controller.getById);
router.post('/', authorize('ADMIN', 'HR'), validate(createEmployeeSchema), controller.create);
router.patch('/:id', authorize('ADMIN', 'HR'), validate(updateEmployeeSchema), controller.update);

export default router;
