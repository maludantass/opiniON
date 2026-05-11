import { Router } from 'express';
import * as opinionController from '../controllers/opinionController.js';
import { JogoRoutes } from './jogoRoutes.js';
import { UserRoutes } from './userRoutes.js';

export class OpinionRoutes {
    readonly router: Router;
    readonly userRoutes: UserRoutes;
    readonly jogoRoutes: JogoRoutes;

    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutes();
        this.jogoRoutes = new JogoRoutes();
        this.register();
    }

    private register(): void {
        this.router.get('/', opinionController.getOpinion);
        this.router.use('/users', this.userRoutes.router);
        this.router.use('/jogos', this.jogoRoutes.router);
    }
}

export default new OpinionRoutes().router;
