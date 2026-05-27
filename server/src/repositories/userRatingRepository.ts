import type { CreationAttributes } from 'sequelize';
import type { UserRatingAttrs } from '../models/UserRating.js';
import { UserRating } from '../models/UserRating.js';

export class UserRatingRepository {
    findByUserId(userId: number): Promise<UserRating[]> {
        return UserRating.findAll({ where: { userId } });
    }

    findByUserAndJogo(userId: number, jogoId: number): Promise<UserRating | null> {
        return UserRating.findOne({ where: { userId, jogoId } });
    }

    findAll(): Promise<UserRating[]> {
        return UserRating.findAll();
    }

    create(attrs: Omit<UserRatingAttrs, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRating> {
        return UserRating.create(attrs as CreationAttributes<UserRating>);
    }

    async upsert(
        userId: number,
        jogoId: number,
        values: Partial<Pick<UserRatingAttrs, 'rating' | 'favorited' | 'listed' | 'played' | 'category'>>,
    ): Promise<UserRating> {
        const existing = await this.findByUserAndJogo(userId, jogoId);

        if (existing) {
            await existing.update(values);
            return existing;
        }

        return this.create({
            userId, jogoId,
            rating: null, favorited: false, listed: false, played: false, category: null,
            ...values,
        });
    }
}