import { Router } from 'express';
import { HolidayController } from '../controllers/holiday.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createHolidaySchema, updateHolidaySchema } from '../dtos/holiday.dto';

const router = Router();
const controller = new HolidayController();

router.use(authenticate);

router.get('/', controller.getByYear);
router.post('/', authorize('HR', 'ADMIN'), validate(createHolidaySchema), controller.create);
router.put('/:id', authorize('HR', 'ADMIN'), validate(updateHolidaySchema), controller.update);
router.delete('/:id', authorize('HR', 'ADMIN'), controller.delete);

export default router;
