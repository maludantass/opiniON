import { AppError } from '../errors/AppError.js';
import { UserFollowRepository } from '../repositories/userFollowRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { normalizePagination, type PaginationInput } from '../utils/pagination.js';
import {
    parsePaginationQuery,
    parseRouteId,
    requireAuthUserId,
} from '../utils/request.js';
import {
    toPublicProfileUser,
    type PublicProfileUser,
} from '../utils/publicUser.js';

export type PublicFollowUser = PublicProfileUser;

export interface FollowActionInput {
    followerId: number | undefined;
    targetUserId: unknown;
}

export interface FollowListInput {
    userId: unknown;
    limit?: unknown;
    offset?: unknown;
}

function assertNotSelfFollow(followerId: number, followedId: number): void {
    if (followerId === followedId) {
        throw new AppError('Não é possível seguir a si mesmo', 400);
    }
}

export class FollowService {
    constructor(
        private readonly userFollowRepository = new UserFollowRepository(),
        private readonly userRepository = new UserRepository(),
    ) {}

    async follow(input: FollowActionInput) {
        const followerId = requireAuthUserId(input.followerId);
        const followedId = parseRouteId(input.targetUserId);
        assertNotSelfFollow(followerId, followedId);

        const target = await this.userRepository.findById(followedId);

        if (!target) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const existing = await this.userFollowRepository.findPair(
            followerId,
            followedId,
        );

        if (existing) {
            throw new AppError('Você já segue este usuário', 409);
        }

        await this.userFollowRepository.create(followerId, followedId);

        return { following: true };
    }

    async unfollow(input: FollowActionInput) {
        const followerId = requireAuthUserId(input.followerId);
        const followedId = parseRouteId(input.targetUserId);

        if (followerId === followedId) {
            throw new AppError('Operação inválida', 400);
        }

        const deleted = await this.userFollowRepository.destroyPair(
            followerId,
            followedId,
        );

        if (deleted === 0) {
            throw new AppError('Você não segue este usuário', 404);
        }

        return { following: false };
    }

    async getFollowStatus(input: FollowActionInput) {
        const viewerId = requireAuthUserId(input.followerId);
        const targetUserId = parseRouteId(input.targetUserId);

        if (viewerId === targetUserId) {
            return { isFollowing: false, isSelf: true };
        }

        const target = await this.userRepository.findById(targetUserId);

        if (!target) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const existing = await this.userFollowRepository.findPair(
            viewerId,
            targetUserId,
        );

        return { isFollowing: existing !== null, isSelf: false };
    }

    async listFollowers(input: FollowListInput) {
        const userId = parseRouteId(input.userId);
        const pagination = parsePaginationQuery(input);

        const target = await this.userRepository.findById(userId);

        if (!target) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const { limit, offset } = normalizePagination(pagination);
        const [items, total] = await Promise.all([
            this.userFollowRepository.findFollowerUsers(userId, limit, offset),
            this.userFollowRepository.countFollowers(userId),
        ]);

        return {
            items: items.map(toPublicProfileUser),
            total,
        };
    }

    async listFollowing(input: FollowListInput) {
        const userId = parseRouteId(input.userId);
        const pagination = parsePaginationQuery(input);

        const target = await this.userRepository.findById(userId);

        if (!target) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const { limit, offset } = normalizePagination(pagination);
        const [items, total] = await Promise.all([
            this.userFollowRepository.findFollowingUsers(userId, limit, offset),
            this.userFollowRepository.countFollowing(userId),
        ]);

        return {
            items: items.map(toPublicProfileUser),
            total,
        };
    }

    async getUserWithFollowers(input: { userId: unknown }) {
        const userId = parseRouteId(input.userId);
        const user = await this.userRepository.findByIdWithFollowers(userId, {
            attributes: ['id', 'username', 'avatarUrl', 'email'],
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const followers = user.followers ?? [];

        return {
            id: user.id,
            username: user.username ?? null,
            avatarUrl: user.avatarUrl ?? null,
            followers: followers.map(toPublicProfileUser),
            followersCount: followers.length,
        };
    }

    async getUserWithFollowing(input: { userId: unknown }) {
        const userId = parseRouteId(input.userId);
        const user = await this.userRepository.findByIdWithFollowing(userId, {
            attributes: ['id', 'username', 'avatarUrl', 'email'],
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const following = user.following ?? [];

        return {
            id: user.id,
            username: user.username ?? null,
            avatarUrl: user.avatarUrl ?? null,
            following: following.map(toPublicProfileUser),
            followingCount: following.length,
        };
    }
}
