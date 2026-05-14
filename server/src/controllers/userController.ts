import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError, sendSuccess } from '../utils/httpResponse.js';
import { UserService, type UserListFilter } from '../services/userService.js';

const userService = new UserService();

function handleError(res: Response, e: unknown): Response {
    if (e instanceof AppError) {
        return sendError(res, e.message, e.statusCode, e.details);
    }
    console.error(e);
    return sendError(res, 'Erro interno no servidor', 500);
}

export const register = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const data = await userService.register({
            email: req.body?.email,
            password: req.body?.password,
            username: req.body?.username ?? req.body?.name ?? null,
        });
        sendSuccess(res, data, 201);
    } catch (e) {
        handleError(res, e);
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await userService.login({
            email: req.body?.email,
            password: req.body?.password,
        });
        sendSuccess(res, data, 200);
    } catch (e) {
        handleError(res, e);
    }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: UserListFilter = {};
        if (req.query['limit'] !== undefined) {
            filter.limit = Number(req.query['limit']);
        }
        if (req.query['offset'] !== undefined) {
            filter.offset = Number(req.query['offset']);
        }
        if (typeof req.query['email'] === 'string') {
            filter.emailContains = req.query['email'];
        }
        if (
            (filter.limit !== undefined && !Number.isFinite(filter.limit)) ||
            (filter.offset !== undefined && !Number.isFinite(filter.offset))
        ) {
            sendError(res, 'limit e offset devem ser numéricos', 400);
            return;
        }
        const data = await userService.listUsers(filter);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const updateUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) {
            sendError(res, 'Id inválido', 400);
            return;
        }
        const authId = req.authUserId;
        if (authId === undefined) {
            sendError(res, 'Não autenticado', 401);
            return;
        }
        const data = await userService.updateUser(
            id,
            {
                email: req.body?.email,
                password: req.body?.password,
                username: req.body?.username,
                avatarUrl: req.body?.avatarUrl,
            },
            authId,
        );
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) {
            sendError(res, 'Id inválido', 400);
            return;
        }
        const authId = req.authUserId;
        if (authId === undefined) {
            sendError(res, 'Não autenticado', 401);
            return;
        }
        await userService.deleteUser(id, authId);
        sendSuccess(res, { deleted: true });
    } catch (e) {
        handleError(res, e);
    }
};
