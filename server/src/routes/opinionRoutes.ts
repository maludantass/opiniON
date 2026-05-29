import { Router } from 'express';
import * as opinionController from '../controllers/opinionController.js';
import { CompatibilityRoutes } from './compatibilityRoutes.js';
import { CommunityRoutes } from './communityRoutes.js';
import { JogoRoutes } from './jogoRoutes.js';
import { ListaRoutes } from './listaRoutes.js';
import { PostRoutes } from './postRoutes.js';
import { UserRoutes } from './userRoutes.js';

export class OpinionRoutes {
    readonly router: Router;
    readonly userRoutes: UserRoutes;
    readonly jogoRoutes: JogoRoutes;
    readonly postRoutes: PostRoutes;
    readonly compatibilityRoutes: CompatibilityRoutes;
    readonly communityRoutes: CommunityRoutes;
    readonly listaRoutes: ListaRoutes;

    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutes();
        this.jogoRoutes = new JogoRoutes();
        this.postRoutes = new PostRoutes();
        this.compatibilityRoutes = new CompatibilityRoutes();
        this.communityRoutes = new CommunityRoutes();
        this.listaRoutes = new ListaRoutes();
        this.register();
    }

    private register(): void {
        this.router.get('/', opinionController.getOpinion);
        this.router.use('/users', this.userRoutes.router);
        this.router.use('/jogos', this.jogoRoutes.router);
        this.router.use('/posts', this.postRoutes.router);
        this.router.use('/compatibility', this.compatibilityRoutes.router);
        this.router.use('/communities', this.communityRoutes.router);
        this.router.use('/listas', this.listaRoutes.router);
    }
}

export default new OpinionRoutes().router;
