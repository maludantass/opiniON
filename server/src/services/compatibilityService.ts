import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import type { UserRating } from '../models/UserRating.js';
import { JogoRepository } from '../repositories/jogoRepository.js';
import { UserRatingRepository } from '../repositories/userRatingRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

export type CompatibilityLabel = 'Alto' | 'Médio' | 'Baixo';

export interface SharedWork {
    jogoId: number;
    title: string;
    imageUrl: string | null;
    myRating: number | null;
    theirRating: number | null;
}

export interface UserCompatibility {
    userId: number;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    score: number;
    label: CompatibilityLabel;
    sharedRatings: number;
    sharedFavorites: number;
    sharedListed: number;
}

export interface UserCompatibilityDetail extends UserCompatibility {
    categoryScores: { jogos: number };
    sharedFavoriteWorks: SharedWork[];
    commonTags: string[];
}

export interface CompatibilityDistribution {
    range: string;
    min: number;
    max: number;
    count: number;
}

export interface CompatibilityAnalytics {
    distribution: CompatibilityDistribution[];
    total: number;
}

export interface TopGame {
    jogoId: number;
    title: string;
    imageUrl: string | null;
    favoritesCount: number;
}

export interface RareTaste {
    percentage: number;
    rareFavoritesCount: number;
    totalFavoritesCount: number;
}

export interface PrimeiroAmor {
    jogoId: number;
    title: string;
    imageUrl: string | null;
    createdAt: string;
}

export interface DashboardStats {
    topFavoritedGame: TopGame | null;
    myTagDistribution: { tag: string; count: number }[];
    rareTaste: RareTaste | null;
    primeiroAmor: PrimeiroAmor | null;
}

function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, v, i) => sum + v * b[i]!, 0);
    const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
}

function jaccardSimilarity(setA: Set<number>, setB: Set<number>): number {
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersectionSize = [...setA].filter(x => setB.has(x)).length;
    const unionSize = new Set([...setA, ...setB]).size;
    return intersectionSize / unionSize;
}

function calculateScore(ratingsA: UserRating[], ratingsB: UserRating[]): {
    score: number;
    sharedRatings: number;
    sharedFavorites: number;
    sharedListed: number;
    sharedFavoriteIds: number[];
} {
    const mapA = new Map(ratingsA.map(r => [r.jogoId, r.rating]));
    const mapB = new Map(ratingsB.map(r => [r.jogoId, r.rating]));

    const commonRated = [...mapA.keys()].filter(
        id => mapB.has(id) && mapA.get(id) !== null && mapB.get(id) !== null,
    );

    let ratingScore = 0;
    if (commonRated.length > 0) {
        const vecA = commonRated.map(id => mapA.get(id)!);
        const vecB = commonRated.map(id => mapB.get(id)!);
        ratingScore = cosineSimilarity(vecA, vecB);
    }

    const favsA = new Set(ratingsA.filter(r => r.favorited).map(r => r.jogoId));
    const favsB = new Set(ratingsB.filter(r => r.favorited).map(r => r.jogoId));
    const favScore = jaccardSimilarity(favsA, favsB);

    const listedA = new Set(ratingsA.filter(r => r.listed).map(r => r.jogoId));
    const listedB = new Set(ratingsB.filter(r => r.listed).map(r => r.jogoId));
    const listScore = jaccardSimilarity(listedA, listedB);

    const sharedFavoriteIds = [...favsA].filter(x => favsB.has(x));
    const sharedFavorites = sharedFavoriteIds.length;
    const sharedListed = [...listedA].filter(x => listedB.has(x)).length;

    const hasRatings = commonRated.length > 0;
    const hasFavs = favsA.size > 0 || favsB.size > 0;
    const hasListed = listedA.size > 0 || listedB.size > 0;

    if (!hasRatings && !hasFavs && !hasListed) {
        return { score: 0, sharedRatings: 0, sharedFavorites: 0, sharedListed: 0, sharedFavoriteIds: [] };
    }

    let weighted = 0;
    let totalWeight = 0;

    if (hasRatings) { weighted += ratingScore * 0.6; totalWeight += 0.6; }
    if (hasFavs)    { weighted += favScore * 0.25;   totalWeight += 0.25; }
    if (hasListed)  { weighted += listScore * 0.15;  totalWeight += 0.15; }

    const normalized = totalWeight > 0 ? weighted / totalWeight : 0;
    const score = Math.round(normalized * 100);

    return { score, sharedRatings: commonRated.length, sharedFavorites, sharedListed, sharedFavoriteIds };
}

function toLabel(score: number): CompatibilityLabel {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
}

export class CompatibilityService {
    constructor(
        private readonly userRatingRepository = new UserRatingRepository(),
        private readonly userRepository = new UserRepository(),
        private readonly jogoRepository = new JogoRepository(),
    ) {}

    async listCompatibleUsers(currentUserId: number): Promise<UserCompatibility[]> {
        const [allRatings, allUsers] = await Promise.all([
            this.userRatingRepository.findAll(),
            this.userRepository.findAll({ attributes: ['id', 'email', 'username', 'avatarUrl'] }),
        ]);

        const ratingsByUser = new Map<number, UserRating[]>();
        for (const rating of allRatings) {
            if (!ratingsByUser.has(rating.userId)) {
                ratingsByUser.set(rating.userId, []);
            }
            ratingsByUser.get(rating.userId)!.push(rating);
        }

        const myRatings = ratingsByUser.get(currentUserId) ?? [];
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        const results: UserCompatibility[] = [];

        for (const user of allUsers) {
            if (user.id === currentUserId) continue;

            const theirRatings = ratingsByUser.get(user.id) ?? [];
            const { score, sharedRatings, sharedFavorites, sharedListed } =
                calculateScore(myRatings, theirRatings);

            const u = userMap.get(user.id)!;
            results.push({
                userId: user.id,
                email: u.email,
                username: u.username ?? null,
                avatarUrl: u.avatarUrl ?? null,
                score,
                label: toLabel(score),
                sharedRatings,
                sharedFavorites,
                sharedListed,
            });
        }

        return results.sort((a, b) => b.score - a.score);
    }

    async getCompatibilityWithUser(
        currentUserId: number,
        targetUserId: number,
    ): Promise<UserCompatibilityDetail> {
        if (currentUserId === targetUserId) {
            throw new AppError('Não é possível calcular compatibilidade consigo mesmo', 400);
        }

        const targetUser = await this.userRepository.findById(targetUserId);
        if (!targetUser) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const [myRatings, theirRatings] = await Promise.all([
            this.userRatingRepository.findByUserId(currentUserId),
            this.userRatingRepository.findByUserId(targetUserId),
        ]);

        const { score, sharedRatings, sharedFavorites, sharedListed, sharedFavoriteIds } =
            calculateScore(myRatings, theirRatings);

        const myRatingMap = new Map(myRatings.map(r => [r.jogoId, r.rating]));
        const theirRatingMap = new Map(theirRatings.map(r => [r.jogoId, r.rating]));

        let sharedFavoriteWorks: SharedWork[] = [];
        let commonTags: string[] = [];

        if (sharedFavoriteIds.length > 0) {
            const jogos = await this.jogoRepository.findAll({
                where: { id: { [Op.in]: sharedFavoriteIds } },
                attributes: ['id', 'title', 'imageUrl', 'tags'],
            });

            sharedFavoriteWorks = jogos.map(j => ({
                jogoId: j.id,
                title: j.title,
                imageUrl: j.imageUrl,
                myRating: myRatingMap.get(j.id) ?? null,
                theirRating: theirRatingMap.get(j.id) ?? null,
            }));

            const tagSet = new Set<string>();
            for (const j of jogos) {
                for (const tag of j.tags) tagSet.add(tag);
            }
            commonTags = [...tagSet].sort();
        }

        return {
            userId: targetUserId,
            email: targetUser.email,
            username: targetUser.username ?? null,
            avatarUrl: targetUser.avatarUrl ?? null,
            score,
            label: toLabel(score),
            sharedRatings,
            sharedFavorites,
            sharedListed,
            categoryScores: { jogos: score },
            sharedFavoriteWorks,
            commonTags,
        };
    }

    async getDistribution(currentUserId: number): Promise<CompatibilityAnalytics> {
        const users = await this.listCompatibleUsers(currentUserId);

        const brackets: CompatibilityDistribution[] = [
            { range: '0–19%',   min: 0,  max: 19,  count: 0 },
            { range: '20–39%',  min: 20, max: 39,  count: 0 },
            { range: '40–59%',  min: 40, max: 59,  count: 0 },
            { range: '60–79%',  min: 60, max: 79,  count: 0 },
            { range: '80–100%', min: 80, max: 100, count: 0 },
        ];

        for (const user of users) {
            const bracket = brackets.find(b => user.score >= b.min && user.score <= b.max);
            if (bracket) bracket.count++;
        }

        return { distribution: brackets, total: users.length };
    }

    async upsertRating(
        userId: number,
        jogoId: number,
        values: { rating?: number | null; favorited?: boolean; listed?: boolean; played?: boolean; category?: string | null },
    ) {
        return this.userRatingRepository.upsert(userId, jogoId, values);
    }

    async getMyRatings(userId: number) {
        return this.userRatingRepository.findByUserId(userId);
    }

    async getDashboardStats(userId: number): Promise<DashboardStats> {
        const [allRatings, allJogos] = await Promise.all([
            this.userRatingRepository.findAll(),
            this.jogoRepository.findAll({ attributes: ['id', 'title', 'imageUrl', 'tags'] }),
        ]);

        const jogoMap = new Map(allJogos.map(j => [j.id, j]));

        // Top globally favorited game
        const favCounts = new Map<number, number>();
        for (const r of allRatings) {
            if (r.favorited) {
                favCounts.set(r.jogoId, (favCounts.get(r.jogoId) ?? 0) + 1);
            }
        }
        const topFavEntry = [...favCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        const topFavoritedGame: TopGame | null = topFavEntry
            ? {
                jogoId: topFavEntry[0],
                title: jogoMap.get(topFavEntry[0])?.title ?? 'Desconhecido',
                imageUrl: jogoMap.get(topFavEntry[0])?.imageUrl ?? null,
                favoritesCount: topFavEntry[1],
            }
            : null;

        // Tag distribution for the current user's rated/favorited/listed games
        const myRatings = allRatings.filter(r => r.userId === userId);
        const tagCounts = new Map<string, number>();
        for (const r of myRatings) {
            const jogo = jogoMap.get(r.jogoId);
            if (jogo) {
                for (const tag of jogo.tags) {
                    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
                }
            }
        }
        const myTagDistribution = [...tagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([tag, count]) => ({ tag, count }));

        // Rare taste: favorites that fewer than 3 OTHER users have interacted with
        const RARE_THRESHOLD = 2;
        const myFavoritedIds = myRatings.filter(r => r.favorited).map(r => r.jogoId);

        let rareFavoritesCount = 0;
        for (const jogoId of myFavoritedIds) {
            const otherUsersCount = new Set(
                allRatings
                    .filter(r => r.jogoId === jogoId && r.userId !== userId)
                    .map(r => r.userId),
            ).size;
            if (otherUsersCount <= RARE_THRESHOLD) rareFavoritesCount++;
        }

        const rareTaste: RareTaste | null = myFavoritedIds.length > 0
            ? {
                percentage: Math.round((rareFavoritesCount / myFavoritedIds.length) * 100),
                rareFavoritesCount,
                totalFavoritesCount: myFavoritedIds.length,
            }
            : null;

        // Primeiro amor - earliest interaction ever
        const primeiroAmor: PrimeiroAmor | null = myRatings.length > 0
            ? (() => {
                const first = [...myRatings].sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
                )[0]!;
                return {
                    jogoId: first.jogoId,
                    title: jogoMap.get(first.jogoId)?.title ?? 'Desconhecido',
                    imageUrl: jogoMap.get(first.jogoId)?.imageUrl ?? null,
                    createdAt: first.createdAt.toISOString(),
                };
            })()
            : null;

        return { topFavoritedGame, myTagDistribution, rareTaste, primeiroAmor };
    }
}
