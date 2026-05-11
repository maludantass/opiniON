import { Router } from 'express';
import * as jogoController from '../controllers/jogoController.js';
import { authJwt } from '../middleware/authJwt.js';

export class JogoRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/', jogoController.getJogos);
        this.router.get('/:id', jogoController.getJogoById);
        this.router.post('/', authJwt(), jogoController.createJogo);
        this.router.put('/:id', authJwt(), jogoController.updateJogo);
        this.router.delete('/:id', authJwt(), jogoController.deleteJogo);
    }
}
