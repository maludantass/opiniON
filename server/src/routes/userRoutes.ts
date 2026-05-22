import { Router } from 'express';
import * as followController from '../controllers/followController.js';
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

        this.router.get('/:id/followers', followController.getFollowers);
        this.router.get('/:id/following', followController.getFollowing);
        this.router.get(
            '/:id/followers/include',
            followController.getUserWithFollowers,
        );
        this.router.get(
            '/:id/following/include',
            followController.getUserWithFollowing,
        );
        this.router.get(
            '/:id/follow-status',
            authJwt(),
            followController.getFollowStatus,
        );
        this.router.post('/:id/follow', authJwt(), followController.followUser);
        this.router.delete(
            '/:id/follow',
            authJwt(),
            followController.unfollowUser,
        );

        this.router.put('/:id', authJwt(), userController.updateUser);
        this.router.delete('/:id', authJwt(), userController.deleteUser);
    }
}
