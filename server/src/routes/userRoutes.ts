import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authJwt } from '../middleware/authJwt.js';

export class UserRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.post('/register', userController.register);
        this.router.post('/login', userController.login);
        this.router.get('/public', userController.getPublicUsers);
        this.router.get('/', authJwt(), userController.getUsers);
        this.router.put('/:id', authJwt(), userController.updateUser);
        this.router.delete('/:id', authJwt(), userController.deleteUser);
    }
}
