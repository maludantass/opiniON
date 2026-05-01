import { Router } from 'express';
import * as opinionController from '../controllers/opinionController';

const router = Router();

router.get('/', opinionController.getOpinion);

export default router;
