import { Router } from 'express';
import * as listaController from '../controllers/listaController.js';
import { authJwt } from '../middleware/authJwt.js';

export class ListaRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/minhas', authJwt(), listaController.getMinhas);
        this.router.post('/', authJwt(), listaController.createLista);
        this.router.put('/:id', authJwt(), listaController.updateLista);
        this.router.delete('/:id', authJwt(), listaController.deleteLista);
        this.router.post('/:id/jogos', authJwt(), listaController.addJogo);
        this.router.delete('/:id/jogos/:jogoId', authJwt(), listaController.removeJogo);
    }
}
