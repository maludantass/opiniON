import { Router } from 'express';
import * as swiperController from '../controllers/swiperController.js';
import { authJwt } from '../middleware/authJwt.js';

export class SwiperRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/next', authJwt(), swiperController.getNext);
        this.router.post('/swipe', authJwt(), swiperController.swipe);
        this.router.get('/favorites', authJwt(), swiperController.listFavorites);
    }
}
