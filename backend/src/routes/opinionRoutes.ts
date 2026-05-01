import { Router } from 'express';
import * as opinionController from '../controllers/opinionController.js';
import { UserRoutes } from './userRoutes.js';

export class OpinionRoutes {
    readonly router: Router;
    readonly userRoutes: UserRoutes;

    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutes();
        this.register();
    }

    private register(): void {
        this.router.get('/', opinionController.getOpinion);
        this.router.use('/users', this.userRoutes.router);
    }
}

export default new OpinionRoutes().router;
