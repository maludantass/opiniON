import { Router } from 'express';
import * as compatibilityController from '../controllers/compatibilityController.js';
import { authJwt } from '../middleware/authJwt.js';

export class CompatibilityRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/users', authJwt(), compatibilityController.listCompatibleUsers);
        this.router.get('/distribution', authJwt(), compatibilityController.getDistribution);
        this.router.get('/stats', authJwt(), compatibilityController.getDashboardStats);
        this.router.get('/users/:userId', authJwt(), compatibilityController.getCompatibilityWithUser);
        this.router.get('/ratings', authJwt(), compatibilityController.getMyRatings);
        this.router.post('/ratings', authJwt(), compatibilityController.upsertRating);
    }
}
