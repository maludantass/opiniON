import { Op } from 'sequelize';
import type {
    CreationAttributes,
    DestroyOptions,
    FindOptions,
} from 'sequelize';
import type { Transaction } from 'sequelize';
import { User } from '../models/User.js';
import { UserFollow } from '../models/UserFollow.js';

const publicUserAttributes = ['id', 'username', 'avatarUrl'] as const;

export class UserFollowRepository {
    findPair(
        followerId: number,
        followedId: number,
        options?: Omit<FindOptions<UserFollow>, 'where'>,
    ): Promise<UserFollow | null> {
        return UserFollow.findOne({
            where: { followerId, followedId },
            ...options,
        });
    }

    create(
        followerId: number,
        followedId: number,
        options?: { transaction?: Transaction },
    ): Promise<UserFollow> {
        return UserFollow.create(
            { followerId, followedId } as CreationAttributes<UserFollow>,
            options,
        );
    }

    destroyPair(
        followerId: number,
        followedId: number,
        options?: Omit<DestroyOptions<UserFollow>, 'where'>,
    ): Promise<number> {
        return UserFollow.destroy({
            where: { followerId, followedId },
            ...options,
        });
    }

    countFollowers(followedId: number): Promise<number> {
        return UserFollow.count({ where: { followedId } });
    }

    countFollowing(followerId: number): Promise<number> {
        return UserFollow.count({ where: { followerId } });
    }

    countFollowersSince(followedId: number, since: Date): Promise<number> {
        return UserFollow.count({ where: { followedId, createdAt: { [Op.gte]: since } } });
    }

    async findFollowerUsers(
        followedId: number,
        limit: number,
        offset: number,
    ): Promise<User[]> {
        const rows = await UserFollow.findAll({
            where: { followedId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'follower',
                    attributes: [...publicUserAttributes],
                },
            ],
        });

        return rows
            .map((row) => row.get('follower') as User | undefined)
            .filter((user): user is User => user !== undefined);
    }

    async findFollowingUsers(
        followerId: number,
        limit: number,
        offset: number,
    ): Promise<User[]> {
        const rows = await UserFollow.findAll({
            where: { followerId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'followed',
                    attributes: [...publicUserAttributes],
                },
            ],
        });

        return rows
            .map((row) => row.get('followed') as User | undefined)
            .filter((user): user is User => user !== undefined);
    }
}
