import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError, sendSuccess } from '../utils/httpResponse.js';
import { CompatibilityService } from '../services/compatibilityService.js';

const compatibilityService = new CompatibilityService();

function handleError(res: Response, e: unknown): Response {
    if (e instanceof AppError) {
        return sendError(res, e.message, e.statusCode, e.details);
    }
    console.error(e);
    return sendError(res, 'Erro interno no servidor', 500);
}

export const listCompatibleUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const data = await compatibilityService.listCompatibleUsers(authId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getCompatibilityWithUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const targetId = Number(req.params['userId']);
        if (!Number.isFinite(targetId)) { sendError(res, 'Id inválido', 400); return; }

        const data = await compatibilityService.getCompatibilityWithUser(authId, targetId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const data = await compatibilityService.getDistribution(authId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const upsertRating = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const jogoId = Number(req.body?.jogoId);
        if (!Number.isFinite(jogoId)) { sendError(res, 'jogoId inválido', 400); return; }

        const { rating, favorited, listed, played, category } = req.body ?? {};

        if (rating !== undefined && rating !== null) {
            const r = Number(rating);
            if (!Number.isFinite(r) || r < 1 || r > 5) {
                sendError(res, 'rating deve ser um número entre 1 e 5', 400);
                return;
            }
        }

        if (category !== undefined && category !== null && typeof category !== 'string') {
            sendError(res, 'category deve ser uma string', 400);
            return;
        }

        const ratingValue: number | null | undefined =
            rating === undefined ? undefined : (rating === null ? null : Number(rating));

        const data = await compatibilityService.upsertRating(authId, jogoId, {
            ...(ratingValue !== undefined && { rating: ratingValue }),
            ...(typeof favorited === 'boolean' && { favorited }),
            ...(typeof listed === 'boolean' && { listed }),
            ...(typeof played === 'boolean' && { played }),
            ...(category !== undefined && { category: category ?? null }),
        });

        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getMyRatings = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const data = await compatibilityService.getMyRatings(authId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = req.authUserId;
        if (authId === undefined) { sendError(res, 'Não autenticado', 401); return; }

        const data = await compatibilityService.getDashboardStats(authId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};
