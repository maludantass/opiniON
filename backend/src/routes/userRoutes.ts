import type { Response } from 'express';
import { Router } from 'express';

/** Rotas REST de usuário — desenvolva o CRUD quando for usar o recurso real. */
export class UserRoutes {
  readonly router: Router;

  constructor() {
    this.router = Router();
    this.register();
  }

  private register(): void {
    this.router.get('/', userController.getUsers);
    this.router.post('/', userController.createUser);
    this.router.put('/:id', userController.updateUser);
    this.router.delete('/:id', userController.deleteUser);
  }
}
