import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { applyLeaveSchema, approveLeaveSchema } from '../dtos/leave.dto';

const router = Router();
const controller = new LeaveController();

router.use(authenticate);

router.post('/apply', validate(applyLeaveSchema), controller.apply);
router.get('/my', controller.getMyLeaves);
router.get('/balances', controller.getBalances);
router.get('/pending', authorize('TEAM_LEAD', 'MANAGER', 'HR', 'ADMIN'), controller.getPending);
router.post('/:id/approve', authorize('TEAM_LEAD', 'MANAGER', 'HR', 'ADMIN'), validate(approveLeaveSchema), controller.approve);

export default router;
