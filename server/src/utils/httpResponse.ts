import type { Response } from 'express';
import { AppError } from '../errors/AppError.js';

export function sendSuccess<T>(
    res: Response,
    data: T,
    status: number = 200,
): Response {
    return res.status(status).json({ success: true, data });
}

export function sendError(
    res: Response,
    message: string,
    status: number = 500,
    details?: unknown,
): Response {
    return res.status(status).json({
        success: false,
        error: message,
        ...(details !== undefined ? { details } : {}),
    });
}

export function handleError(res: Response, e: unknown): Response {
    if (e instanceof AppError) {
        return sendError(res, e.message, e.statusCode, e.details);
    }
    console.error(e);
    return sendError(res, 'Erro interno no servidor', 500);
}
