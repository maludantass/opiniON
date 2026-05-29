import type { Request, Response } from 'express';
import { SwiperService } from '../services/swiperService.js';
import { handleError, sendSuccess } from '../utils/httpResponse.js';

const swiperService = new SwiperService();

export const getNext = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await swiperService.getNext({
            userId: req.authUserId,
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const swipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await swiperService.swipe({
            userId: req.authUserId,
            jogoId: req.body?.jogoId,
            action: req.body?.action,
        });
        sendSuccess(res, data, 201);
    } catch (error) {
        handleError(res, error);
    }
};

export const listFavorites = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const data = await swiperService.listFavorites({
            userId: req.authUserId,
            limit: req.query['limit'],
            offset: req.query['offset'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};
