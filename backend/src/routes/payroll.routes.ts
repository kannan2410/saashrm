import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { generatePayrollSchema } from '../dtos/payroll.dto';

const router = Router();
const controller = new PayrollController();

router.use(authenticate);

router.get('/my', controller.getMyPayrolls);
router.get('/all', authorize('ADMIN', 'HR'), controller.getAll);
router.get('/:id', controller.getSlip);
router.get('/:id/download', controller.downloadPdf);
router.post('/generate', authorize('ADMIN', 'HR'), validate(generatePayrollSchema), controller.generate);

export default router;
