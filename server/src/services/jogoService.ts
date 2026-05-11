import type { FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import type { Jogo, JogoAttrs } from '../models/Jogo.js';
import { JogoRepository } from '../repositories/jogoRepository.js';

export interface CreateJogoInput {
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    tags?: string[];
    releaseYear?: number | null;
    platforms?: string[];
}

export interface UpdateJogoInput {
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    tags?: string[];
    releaseYear?: number | null;
    platforms?: string[];
}

export interface JogoListFilter {
    limit?: number | undefined;
    offset?: number | undefined;
    titleContains?: string | undefined;
}

function releaseYearMax(): number {
    return new Date().getFullYear() + 2;
}

function normalizeDescription(
    description: string | null | undefined,
): string | null {
    if (description === undefined || description === null) {
        return null;
    }

    const normalized = description.trim();

    if (!normalized) {
        return null;
    }

    if (normalized.length > 5000) {
        throw new AppError('Descrição deve ter no máximo 5000 caracteres', 400);
    }

    return normalized;
}

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
    if (imageUrl === undefined || imageUrl === null) {
        return null;
    }

    const normalized = imageUrl.trim();

    if (!normalized) {
        return null;
    }

    if (normalized.length > 2048) {
        throw new AppError(
            'URL da imagem deve ter no máximo 2048 caracteres',
            400,
        );
    }

    try {
        const parsed = new URL(normalized);

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new AppError('URL da imagem deve usar http ou https', 400);
        }
    } catch (e) {
        if (e instanceof AppError) {
            throw e;
        }

        throw new AppError('URL da imagem inválida', 400);
    }

    return normalized;
}

function normalizeReleaseYear(
    releaseYear: number | null | undefined,
): number | null {
    if (releaseYear === undefined || releaseYear === null) {
        return null;
    }

    if (!Number.isInteger(releaseYear)) {
        throw new AppError('Ano de lançamento deve ser um número inteiro', 400);
    }

    const minYear = 1970;
    const maxYear = releaseYearMax();

    if (releaseYear < minYear || releaseYear > maxYear) {
        throw new AppError(
            `Ano de lançamento deve estar entre ${minYear} e ${maxYear}`,
            400,
        );
    }

    return releaseYear;
}

function normalizeStringArray(
    value: unknown,
    fieldName: string,
): string[] | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return [];
    }

    if (!Array.isArray(value)) {
        throw new AppError(`${fieldName} deve ser um array de strings`, 400);
    }

    if (value.length > 50) {
        throw new AppError(`${fieldName} não pode ter mais de 50 itens`, 400);
    }

    const normalized: string[] = [];

    for (const item of value) {
        if (typeof item !== 'string') {
            throw new AppError(`${fieldName} deve ser um array de strings`, 400);
        }

        const trimmed = item.trim();

        if (!trimmed) {
            throw new AppError(`${fieldName} não pode conter itens vazios`, 400);
        }

        if (trimmed.length > 100) {
            throw new AppError(
                `Cada item de ${fieldName} deve ter no máximo 100 caracteres`,
                400,
            );
        }

        normalized.push(trimmed);
    }

    return normalized;
}

function toPublicJogo(jogo: Jogo) {
    return {
        id: jogo.id,
        title: jogo.title,
        description: jogo.description,
        imageUrl: jogo.imageUrl,
        tags: jogo.tags,
        releaseYear: jogo.releaseYear,
        platforms: jogo.platforms,
        createdAt: jogo.createdAt,
        updatedAt: jogo.updatedAt,
    };
}

export class JogoService {
    constructor(private readonly jogoRepository = new JogoRepository()) {}

    async createJogo(input: CreateJogoInput) {
        const title = input.title?.trim();

        if (!title) {
            throw new AppError('Título é obrigatório', 400);
        }

        if (title.length > 255) {
            throw new AppError('Título deve ter no máximo 255 caracteres', 400);
        }

        const attrs: Pick<
            JogoAttrs,
            | 'title'
            | 'description'
            | 'imageUrl'
            | 'tags'
            | 'releaseYear'
            | 'platforms'
        > = {
            title,
            description: normalizeDescription(input.description),
            imageUrl: normalizeImageUrl(input.imageUrl),
            tags: normalizeStringArray(input.tags, 'tags') ?? [],
            releaseYear: normalizeReleaseYear(input.releaseYear),
            platforms: normalizeStringArray(input.platforms, 'platforms') ?? [],
        };

        const jogo = await this.jogoRepository.create(attrs);

        return toPublicJogo(jogo);
    }

    async getJogoById(id: number) {
        const jogo = await this.jogoRepository.findById(id);

        if (!jogo) {
            throw new AppError('Jogo não encontrado', 404);
        }

        return toPublicJogo(jogo);
    }

    async listJogos(filter: JogoListFilter) {
        const limit = Math.min(filter.limit ?? 50, 100);
        const offset = filter.offset ?? 0;
        const opts: FindOptions<Jogo> = {
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: [
                'id',
                'title',
                'description',
                'imageUrl',
                'tags',
                'releaseYear',
                'platforms',
                'createdAt',
                'updatedAt',
            ],
        };

        if (filter.titleContains && filter.titleContains.trim() !== '') {
            opts.where = {
                title: {
                    [Op.iLike]: `%${filter.titleContains.trim()}%`,
                },
            };
        }

        const jogos = await this.jogoRepository.findAll(opts);

        return jogos.map((jogo) => toPublicJogo(jogo));
    }

    async updateJogo(id: number, input: UpdateJogoInput) {
        const jogo = await this.jogoRepository.findById(id);

        if (!jogo) {
            throw new AppError('Jogo não encontrado', 404);
        }

        const updates: Partial<
            Pick<
                JogoAttrs,
                | 'title'
                | 'description'
                | 'imageUrl'
                | 'tags'
                | 'releaseYear'
                | 'platforms'
            >
        > = {};

        if (input.title !== undefined) {
            const title = input.title.trim();

            if (!title) {
                throw new AppError('Título é obrigatório', 400);
            }

            if (title.length > 255) {
                throw new AppError(
                    'Título deve ter no máximo 255 caracteres',
                    400,
                );
            }

            updates.title = title;
        }

        if (input.description !== undefined) {
            updates.description = normalizeDescription(input.description);
        }

        if (input.imageUrl !== undefined) {
            updates.imageUrl = normalizeImageUrl(input.imageUrl);
        }

        if (input.tags !== undefined) {
            updates.tags = normalizeStringArray(input.tags, 'tags') ?? [];
        }

        if (input.releaseYear !== undefined) {
            updates.releaseYear = normalizeReleaseYear(input.releaseYear);
        }

        if (input.platforms !== undefined) {
            updates.platforms =
                normalizeStringArray(input.platforms, 'platforms') ?? [];
        }

        if (Object.keys(updates).length === 0) {
            return toPublicJogo(jogo);
        }

        await this.jogoRepository.updateById(id, updates);

        const updatedJogo = await this.jogoRepository.findById(id);

        if (!updatedJogo) {
            throw new AppError('Jogo não encontrado', 404);
        }

        return toPublicJogo(updatedJogo);
    }

    async deleteJogo(id: number) {
        const deletedRowCount = await this.jogoRepository.destroyById(id);

        if (deletedRowCount === 0) {
            throw new AppError('Jogo não encontrado', 404);
        }
    }
}
