import type { Response } from 'express';

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
