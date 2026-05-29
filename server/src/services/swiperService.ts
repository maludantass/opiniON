import { AppError } from '../errors/AppError.js';
import type { Jogo } from '../models/Jogo.js';
import { Op } from 'sequelize';
import { JogoRepository } from '../repositories/jogoRepository.js';
import { UserRatingRepository } from '../repositories/userRatingRepository.js';
import { normalizePagination, type PaginationInput } from '../utils/pagination.js';
import {
    parsePaginationQuery,
    parseRouteId,
    requireAuthUserId,
} from '../utils/request.js';

export type SwipeAction = 'pass' | 'favorite';

export interface SwiperNextInput {
    userId: number | undefined;
}

export interface SwiperSwipeInput {
    userId: number | undefined;
    jogoId: unknown;
    action: unknown;
}

export interface SwiperFavoritesInput {
    userId: number | undefined;
    limit?: unknown;
    offset?: unknown;
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

function normalizeSwipeAction(action: unknown): SwipeAction {
    if (action !== 'pass' && action !== 'favorite') {
        throw new AppError('action deve ser "pass" ou "favorite"', 400);
    }

    return action;
}

export class SwiperService {
    constructor(
        private readonly jogoRepository = new JogoRepository(),
        private readonly userRatingRepository = new UserRatingRepository(),
    ) {}

    async getNext(input: SwiperNextInput) {
        const userId = requireAuthUserId(input.userId);
        const seenJogoIds =
            await this.userRatingRepository.findJogoIdsByUserId(userId);

        const [jogo, remaining] = await Promise.all([
            this.jogoRepository.findNextUnseenForUser(seenJogoIds),
            this.jogoRepository.countUnseenForUser(seenJogoIds),
        ]);

        return {
            jogo: jogo ? toPublicJogo(jogo) : null,
            remaining,
        };
    }

    async swipe(input: SwiperSwipeInput) {
        const userId = requireAuthUserId(input.userId);
        const jogoId = parseRouteId(input.jogoId);
        const action = normalizeSwipeAction(input.action);

        const jogo = await this.jogoRepository.findById(jogoId);

        if (!jogo) {
            throw new AppError('Jogo não encontrado', 404);
        }

        const existing = await this.userRatingRepository.findByUserAndJogo(
            userId,
            jogoId,
        );

        if (existing) {
            throw new AppError('Você já interagiu com este jogo', 409);
        }

        const rating = await this.userRatingRepository.create({
            userId,
            jogoId,
            rating: null,
            favorited: action === 'favorite',
            listed: false,
            played: false,
            category: null,
        });

        return {
            jogoId: rating.jogoId,
            action,
            favorited: rating.favorited,
        };
    }

    async listFavorites(input: SwiperFavoritesInput) {
        const userId = requireAuthUserId(input.userId);
        const pagination: PaginationInput = parsePaginationQuery(input);
        const { limit, offset } = normalizePagination(pagination);

        const [ratings, total] = await Promise.all([
            this.userRatingRepository.findFavoritedByUserId(
                userId,
                limit,
                offset,
            ),
            this.userRatingRepository.countFavoritedByUserId(userId),
        ]);

        if (ratings.length === 0) {
            return { items: [], total };
        }

        const jogoIds = ratings.map((rating) => rating.jogoId);
        const jogos = await this.jogoRepository.findAll({
            where: { id: { [Op.in]: jogoIds } },
        });
        const jogoMap = new Map(jogos.map((jogo) => [jogo.id, jogo]));

        const items = ratings
            .map((rating) => {
                const jogo = jogoMap.get(rating.jogoId);

                if (!jogo) {
                    return null;
                }

                return {
                    ...toPublicJogo(jogo),
                    favoritedAt: rating.updatedAt,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        return { items, total };
    }
}
