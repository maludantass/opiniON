import { Router } from 'express';
import * as postController from '../controllers/postController.js';
import { authJwt, authJwtOptional } from '../middleware/authJwt.js';

export class PostRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/feed', authJwtOptional(), postController.getFeedPosts);
        this.router.get('/mine', authJwt(), postController.getMyPosts);
        this.router.get('/mine/jogo/:jogoId', authJwt(), postController.getMyPostForGame);
        this.router.get('/', postController.getPosts);
        this.router.get('/:id', postController.getPostById);
        this.router.post('/', authJwt(), postController.createPost);
        this.router.put('/:id', authJwt(), postController.updatePost);
        this.router.delete('/:id', authJwt(), postController.deletePost);
        this.router.post('/:id/like', authJwt(), postController.likePost);
        this.router.delete('/:id/like', authJwt(), postController.unlikePost);
    }
}
