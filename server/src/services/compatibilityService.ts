import { AppError } from '../errors/AppError.js';
import type { UserRating } from '../models/UserRating.js';
import { UserRatingRepository } from '../repositories/userRatingRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

export type CompatibilityLabel = 'muito compatível' | 'compatível' | 'pouco compatível';

export interface UserCompatibility {
    userId: number;
    email: string;
    score: number;
    label: CompatibilityLabel;
    sharedRatings: number;
    sharedFavorites: number;
    sharedListed: number;
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

    const sharedFavorites = [...favsA].filter(x => favsB.has(x)).length;
    const sharedListed = [...listedA].filter(x => listedB.has(x)).length;

    const hasRatings = commonRated.length > 0;
    const hasFavs = favsA.size > 0 || favsB.size > 0;
    const hasListed = listedA.size > 0 || listedB.size > 0;

    if (!hasRatings && !hasFavs && !hasListed) {
        return { score: 0, sharedRatings: 0, sharedFavorites: 0, sharedListed: 0 };
    }

    let weighted = 0;
    let totalWeight = 0;

    if (hasRatings) { weighted += ratingScore * 0.6; totalWeight += 0.6; }
    if (hasFavs)    { weighted += favScore * 0.25;   totalWeight += 0.25; }
    if (hasListed)  { weighted += listScore * 0.15;  totalWeight += 0.15; }

    const normalized = totalWeight > 0 ? weighted / totalWeight : 0;
    const score = Math.round(normalized * 100);

    return { score, sharedRatings: commonRated.length, sharedFavorites, sharedListed };
}

function toLabel(score: number): CompatibilityLabel {
    if (score >= 70) return 'muito compatível';
    if (score >= 40) return 'compatível';
    return 'pouco compatível';
}

export class CompatibilityService {
    constructor(
        private readonly userRatingRepository = new UserRatingRepository(),
        private readonly userRepository = new UserRepository(),
    ) {}

    async listCompatibleUsers(currentUserId: number): Promise<UserCompatibility[]> {
        const [allRatings, allUsers] = await Promise.all([
            this.userRatingRepository.findAll(),
            this.userRepository.findAll({ attributes: ['id', 'email'] }),
        ]);

        const ratingsByUser = new Map<number, UserRating[]>();
        for (const rating of allRatings) {
            if (!ratingsByUser.has(rating.userId)) {
                ratingsByUser.set(rating.userId, []);
            }
            ratingsByUser.get(rating.userId)!.push(rating);
        }

        const myRatings = ratingsByUser.get(currentUserId) ?? [];
        const userMap = new Map(allUsers.map(u => [u.id, u.email]));

        const results: UserCompatibility[] = [];

        for (const user of allUsers) {
            if (user.id === currentUserId) continue;

            const theirRatings = ratingsByUser.get(user.id) ?? [];
            const { score, sharedRatings, sharedFavorites, sharedListed } =
                calculateScore(myRatings, theirRatings);

            results.push({
                userId: user.id,
                email: userMap.get(user.id) ?? '',
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
    ): Promise<UserCompatibility> {
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

        const { score, sharedRatings, sharedFavorites, sharedListed } =
            calculateScore(myRatings, theirRatings);

        return {
            userId: targetUserId,
            email: targetUser.email,
            score,
            label: toLabel(score),
            sharedRatings,
            sharedFavorites,
            sharedListed,
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
        values: { rating?: number | null; favorited?: boolean; listed?: boolean },
    ) {
        return this.userRatingRepository.upsert(userId, jogoId, values);
    }

    async getMyRatings(userId: number) {
        return this.userRatingRepository.findByUserId(userId);
    }
}
