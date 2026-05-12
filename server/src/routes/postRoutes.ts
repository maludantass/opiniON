import { Router } from 'express';
import * as postController from '../controllers/postController.js';
import { authJwt } from '../middleware/authJwt.js';

export class PostRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/', postController.getPosts);
        this.router.get('/:id', postController.getPostById);
        this.router.post('/', authJwt(), postController.createPost);
        this.router.put('/:id', authJwt(), postController.updatePost);
        this.router.delete('/:id', authJwt(), postController.deletePost);
    }
}
