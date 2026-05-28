import type { Request, Response } from 'express';
import { sendError, sendSuccess, handleError } from '../utils/httpResponse.js';
import { parseRouteId, requireAuthUserId } from '../utils/request.js';
import { UserService, type UserListFilter } from '../services/userService.js';

const userService = new UserService();

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
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getPublicUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = Math.min(Number(req.query['limit'] ?? 10), 20);
        const data = await userService.listPublicUsers(Number.isFinite(limit) ? limit : 10);
        sendSuccess(res, data);
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
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await userService.updateUser(
            id,
            {
                email: req.body?.email,
                password: req.body?.password,
                username: req.body?.username,
                avatarUrl: req.body?.avatarUrl,
                bio: req.body?.bio,
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
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        await userService.deleteUser(id, authId);
        sendSuccess(res, { deleted: true });
    } catch (e) {
        handleError(res, e);
    }
};
