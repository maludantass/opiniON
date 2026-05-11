import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError, sendSuccess } from '../utils/httpResponse.js';
import { JogoService, type JogoListFilter } from '../services/jogoService.js';

const jogoService = new JogoService();

function handleError(res: Response, e: unknown): Response {
    if (e instanceof AppError) {
        return sendError(res, e.message, e.statusCode, e.details);
    }
    console.error(e);
    return sendError(res, 'Erro interno no servidor', 500);
}

export const createJogo = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) {
            sendError(res, 'Não autenticado', 401);
            return;
        }
        const data = await jogoService.createJogo({
            title: req.body?.title,
            description: req.body?.description,
            imageUrl: req.body?.imageUrl,
            tags: req.body?.tags,
            releaseYear: req.body?.releaseYear,
            platforms: req.body?.platforms,
        });
        sendSuccess(res, data, 201);
    } catch (e) {
        handleError(res, e);
    }
};

export const getJogos = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: JogoListFilter = {};
        if (req.query['limit'] !== undefined) {
            filter.limit = Number(req.query['limit']);
        }
        if (req.query['offset'] !== undefined) {
            filter.offset = Number(req.query['offset']);
        }
        if (typeof req.query['title'] === 'string') {
            filter.titleContains = req.query['title'];
        }
        if (
            (filter.limit !== undefined && !Number.isFinite(filter.limit)) ||
            (filter.offset !== undefined && !Number.isFinite(filter.offset))
        ) {
            sendError(res, 'limit e offset devem ser numéricos', 400);
            return;
        }
        const data = await jogoService.listJogos(filter);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getJogoById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) {
            sendError(res, 'Id inválido', 400);
            return;
        }
        const data = await jogoService.getJogoById(id);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const updateJogo = async (
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
        const data = await jogoService.updateJogo(id, {
            title: req.body?.title,
            description: req.body?.description,
            imageUrl: req.body?.imageUrl,
            tags: req.body?.tags,
            releaseYear: req.body?.releaseYear,
            platforms: req.body?.platforms,
        });
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const deleteJogo = async (
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
        await jogoService.deleteJogo(id);
        sendSuccess(res, { deleted: true });
    } catch (e) {
        handleError(res, e);
    }
};
