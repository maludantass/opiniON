import { Op } from 'sequelize';
import type { CreationAttributes, DestroyOptions, FindOptions, Transaction } from 'sequelize';
import { PostLike } from '../models/PostLike.js';
import { Post } from '../models/Post.js';

export class PostLikeRepository {
    findOne(
        userId: number,
        postId: number,
        options?: Omit<FindOptions<PostLike>, 'where'>,
    ): Promise<PostLike | null> {
        return PostLike.findOne({
            where: { userId, postId },
            ...options,
        });
    }

    create(
        userId: number,
        postId: number,
        options?: { transaction?: Transaction },
    ): Promise<PostLike> {
        return PostLike.create(
            { userId, postId } as CreationAttributes<PostLike>,
            options,
        );
    }

    destroy(
        userId: number,
        postId: number,
        options?: Omit<DestroyOptions<PostLike>, 'where'>,
    ): Promise<number> {
        return PostLike.destroy({
            where: { userId, postId },
            ...options,
        });
    }

    async exists(userId: number, postId: number): Promise<boolean> {
        const count = await PostLike.count({
            where: { userId, postId },
        });
        return count > 0;
    }

    countLikesForUser(userId: number): Promise<number> {
        return PostLike.count({
            include: [
                {
                    model: Post,
                    as: 'post',
                    where: { userId },
                    required: true,
                },
            ],
        });
    }

    countLikesForUserSince(userId: number, since: Date): Promise<number> {
        return PostLike.count({
            where: {
                createdAt: { [Op.gte]: since },
            },
            include: [
                {
                    model: Post,
                    as: 'post',
                    where: { userId },
                    required: true,
                },
            ],
        });
    }
}
