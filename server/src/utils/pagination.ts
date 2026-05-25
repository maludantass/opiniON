import { AppError } from '../errors/AppError.js';

export interface PaginationInput {
    limit?: number | undefined;
    offset?: number | undefined;
}

export interface PaginationOptions {
    defaultLimit?: number;
    maxLimit?: number;
}

export interface PaginationResult {
    limit: number;
    offset: number;
}

export function normalizePagination(
    filter: PaginationInput,
    options: PaginationOptions = {},
): PaginationResult {
    const defaultLimit = options.defaultLimit ?? 50;
    const maxLimit = options.maxLimit ?? 100;
    const limit = Math.min(filter.limit ?? defaultLimit, maxLimit);
    const offset = filter.offset ?? 0;

    if (
        !Number.isFinite(limit) ||
        !Number.isFinite(offset) ||
        limit < 0 ||
        offset < 0
    ) {
        throw new AppError(
            'limit e offset devem ser numéricos e não negativos',
            400,
        );
    }

    return { limit, offset };
}
