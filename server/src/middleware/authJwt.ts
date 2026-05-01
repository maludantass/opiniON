import jwt from 'jsonwebtoken';
import type { Response, NextFunction, RequestHandler } from 'express';
import { getJwtSecret } from '../config/jwt.js';
import { sendError } from '../utils/httpResponse.js';

export function authJwt(): RequestHandler {
    return (req, res: Response, next: NextFunction): void => {
        const header = req.headers.authorization;

        if (!header?.startsWith('Bearer ')) {
            sendError(res, 'Token JWT ausente', 401);
            return;
        }

        const token = header.slice('Bearer '.length).trim();

        try {
            const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & {
                sub?: number | string;
                email?: string;
            };

            const id = decoded.sub !== undefined ? Number(decoded.sub) : NaN;

            if (!Number.isFinite(id) || !decoded.email) {
                sendError(res, 'Token inválido', 401);
                return;
            }

            req.authUserId = id;
            req.authUserEmail = decoded.email;

            next();
        } catch {
            sendError(res, 'Token inválido ou expirado', 401);
        }
    };
}
