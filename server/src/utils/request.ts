import { AppError } from '../errors/AppError.js';
import type { PaginationInput } from './pagination.js';

export function parseRouteId(value: unknown): number {
    const id = Number(value);

    if (!Number.isFinite(id)) {
        throw new AppError('Id inválido', 400);
    }

    return id;
}

export function requireAuthUserId(authUserId: number | undefined): number {
    if (authUserId === undefined) {
        throw new AppError('Não autenticado', 401);
    }

    return authUserId;
}

export function parsePaginationQuery(query: {
    limit?: unknown;
    offset?: unknown;
}): PaginationInput {
    const filter: PaginationInput = {};

    if (query.limit !== undefined) {
        filter.limit = Number(query.limit);
    }

    if (query.offset !== undefined) {
        filter.offset = Number(query.offset);
    }

    return filter;
}
