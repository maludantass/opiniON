import type { FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import { Post, type PostAttrs } from '../models/Post.js';
import { PostRepository } from '../repositories/postRepository.js';
import { JogoRepository } from '../repositories/jogoRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { UserRating } from '../models/UserRating.js';
import { normalizePagination } from '../utils/pagination.js';
import { PostLikeRepository } from '../repositories/postLikeRepository.js';
import { PostLike } from '../models/PostLike.js';
import { sequelize } from '../config/sequelize.js';
import { UserFollowRepository } from '../repositories/userFollowRepository.js';
import { CommentService } from './commentService.js';

export type PostMediaType = 'image' | 'video';

export interface CreatePostInput {
    content: string;
    mediaUrl?: string | null;
    mediaType?: PostMediaType | null;
    jogoId?: number | null;
    category?: string | null;
}

export interface UpdatePostInput {
    content?: string;
    mediaUrl?: string | null;
    mediaType?: PostMediaType | null;
    category?: string | null;
}

export interface PostListFilter {
    limit?: number | undefined;
    offset?: number | undefined;
    contentContains?: string | undefined;
}

const MAX_CONTENT_LENGTH = 10000;
const MAX_CATEGORY_TAGS = 10;
const MAX_CATEGORY_LENGTH = 255;

export function parseCategoryTags(category: string | null | undefined): string[] {
    if (!category?.trim()) return [];
    return [...new Set(category.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

function normalizeCategory(category: string | null | undefined): string | null {
    if (category === undefined || category === null) return null;
    const tags = parseCategoryTags(category);
    if (tags.length === 0) return null;
    if (tags.length > MAX_CATEGORY_TAGS) {
        throw new AppError(`Máximo de ${MAX_CATEGORY_TAGS} etiquetas`, 400);
    }
    const joined = tags.join(', ');
    if (joined.length > MAX_CATEGORY_LENGTH) {
        throw new AppError(`Etiquetas excedem ${MAX_CATEGORY_LENGTH} caracteres`, 400);
    }
    return joined;
}

function normalizeContent(content: string | null | undefined): string {
    if (content === undefined || content === null) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }
    const normalized = content.trim();
    if (!normalized) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }
    if (normalized.length > MAX_CONTENT_LENGTH) {
        throw new AppError(`Conteúdo deve ter no máximo ${MAX_CONTENT_LENGTH} caracteres`, 400);
    }
    return normalized;
}

function normalizeMediaUrl(mediaUrl: string | null | undefined): string | null {
    if (mediaUrl === undefined || mediaUrl === null) return null;
    const normalized = mediaUrl.trim();
    if (!normalized) return null;
    if (normalized.length > 2048) {
        throw new AppError('URL da mídia deve ter no máximo 2048 caracteres', 400);
    }
    try {
        const parsed = new URL(normalized);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new AppError('URL da mídia deve usar http ou https', 400);
        }
    } catch (e) {
        if (e instanceof AppError) throw e;
        throw new AppError('URL da mídia inválida', 400);
    }
    return normalized;
}

function normalizeMediaType(mediaType: PostMediaType | null | undefined): PostMediaType | null {
    if (mediaType === undefined || mediaType === null) return null;
    if (mediaType !== 'image' && mediaType !== 'video') {
        throw new AppError('Tipo de mídia deve ser image ou video', 400);
    }
    return mediaType;
}

function normalizeMedia(
    mediaUrl: string | null | undefined,
    mediaType: PostMediaType | null | undefined,
): Pick<PostAttrs, 'mediaUrl' | 'mediaType'> {
    const normalizedUrl = normalizeMediaUrl(mediaUrl);
    const normalizedType = normalizeMediaType(mediaType);
    if (normalizedUrl && !normalizedType) {
        throw new AppError('Tipo de mídia é obrigatório quando a URL é informada', 400);
    }
    if (!normalizedUrl && normalizedType) {
        throw new AppError('URL da mídia é obrigatória quando o tipo é informado', 400);
    }
    return { mediaUrl: normalizedUrl, mediaType: normalizedType };
}

function toPublicPost(post: Post) {
    return {
        id: post.id,
        userId: post.userId,
        jogoId: post.jogoId,
        content: post.content,
        category: post.category,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
}

export class PostService {
    constructor(
        private readonly postRepository = new PostRepository(),
        private readonly userRepository = new UserRepository(),
        private readonly jogoRepository = new JogoRepository(),
        private readonly postLikeRepository = new PostLikeRepository(),
        private readonly userFollowRepository = new UserFollowRepository(),
    ) {}

    private async enrichPosts(posts: Post[], requestingUserId?: number) {
        if (posts.length === 0) return [];

        const postIds = posts.map((p) => p.id);
        const userIds = [...new Set(posts.map((p) => p.userId))];
        const jogoIds = posts.map((p) => p.jogoId).filter((id): id is number => id !== null);

        const [users, jogos, ratings, likesCountGroup, userLikes, commentsCountMap] = await Promise.all([
            userIds.length > 0
                ? this.userRepository.findAll({
                    where: { id: { [Op.in]: userIds } },
                    attributes: ['id', 'email', 'username', 'avatarUrl'],
                })
                : Promise.resolve([]),
            jogoIds.length > 0
                ? this.jogoRepository.findAll({
                    where: { id: { [Op.in]: jogoIds } },
                    attributes: ['id', 'title', 'imageUrl', 'tags'],
                })
                : Promise.resolve([]),
            userIds.length > 0 && jogoIds.length > 0
                ? UserRating.findAll({
                    where: {
                        userId: { [Op.in]: userIds },
                        jogoId: { [Op.in]: jogoIds },
                    },
                    attributes: ['userId', 'jogoId', 'rating'],
                })
                : Promise.resolve([]),
            postIds.length > 0
                ? PostLike.findAll({
                    where: { postId: { [Op.in]: postIds } },
                    attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    group: ['postId'],
                    raw: true,
                }) as unknown as Promise<{ postId: number; count: string | number }[]>
                : Promise.resolve([]),
            requestingUserId && postIds.length > 0
                ? PostLike.findAll({
                    where: { postId: { [Op.in]: postIds }, userId: requestingUserId },
                    attributes: ['postId'],
                    raw: true,
                })
                : Promise.resolve([]),
            CommentService.countByPostIds(postIds),
        ]);

        const userMap = new Map(users.map((u) => [u.id, u]));
        const jogoMap = new Map(jogos.map((j) => [j.id, j]));
        const ratingMap = new Map(ratings.map((r) => [`${r.userId}-${r.jogoId}`, r.rating]));

        const likesMap = new Map<number, number>();
        (likesCountGroup as any[]).forEach((g) => likesMap.set(g.postId, parseInt(String(g.count), 10)));

        const likedSet = new Set<number>();
        if (userLikes) {
            (userLikes as any[]).forEach((l: any) => likedSet.add(l.postId));
        }

        return posts.map((p) => {
            const user = userMap.get(p.userId);
            const jogo = p.jogoId ? jogoMap.get(p.jogoId) ?? null : null;
            const rating = p.jogoId ? ratingMap.get(`${p.userId}-${p.jogoId}`) ?? null : null;
            const tagsFinais = parseCategoryTags(p.category);

            return {
                id: p.id,
                content: p.content,
                createdAt: p.createdAt,
                rating,
                user: user
                    ? { id: user.id, username: user.username ?? null, avatarUrl: user.avatarUrl ?? null, email: user.email }
                    : null,
                jogo: jogo
                    ? { id: jogo.id, title: jogo.title, imageUrl: jogo.imageUrl, tags: tagsFinais }
                    : null,
                likesCount: likesMap.get(p.id) ?? 0,
                liked: likedSet.has(p.id),
                commentsCount: commentsCountMap.get(p.id) ?? 0,
            };
        });
    }

    async createPost(userId: number, input: CreatePostInput) {
        const media = normalizeMedia(input.mediaUrl, input.mediaType);
        const content = normalizeContent(input.content);
        const category = normalizeCategory(input.category);

        // One review per game: update existing instead of creating a duplicate
        if (input.jogoId) {
            const existing = await this.postRepository.findAll({
                where: { userId, jogoId: input.jogoId } as any,
                limit: 1,
                order: [['createdAt', 'DESC']],
            });
            if (existing.length > 0) {
                const post = existing[0]!;
                await this.postRepository.updateById(post.id, { content, category, ...media });
                const updated = await this.postRepository.findById(post.id);
                return toPublicPost(updated!);
            }
        }

        const post = await this.postRepository.create({
            userId,
            content,
            jogoId: input.jogoId ?? null,
            category,
            ...media,
        });
        return toPublicPost(post);
    }

    async getPostForGame(userId: number, jogoId: number) {
        const posts = await this.postRepository.findAll({
            where: { userId, jogoId } as any,
            limit: 1,
            order: [['createdAt', 'DESC']],
        });
        if (posts.length === 0) return null;
        const p = posts[0]!;

        const rating = await UserRating.findOne({
            where: { userId, jogoId },
            attributes: ['rating', 'played', 'category'],
        });

        return {
            post: toPublicPost(p),
            rating: rating
                ? { rating: rating.rating, played: rating.played, category: rating.category }
                : null,
        };
    }

    async getPostById(id: number, requestingUserId?: number) {
        const post = await this.postRepository.findById(id);
        if (!post) throw new AppError('Post não encontrado', 404);
        const enriched = await this.enrichPosts([post], requestingUserId);
        return enriched[0]!;
    }

    async listPosts(filter: PostListFilter) {
        const { limit, offset } = normalizePagination(filter, { defaultLimit: 50, maxLimit: 100 });
        const opts: FindOptions<Post> = {
            limit,
            offset,
            order: [['id', 'DESC']],
            attributes: ['id', 'userId', 'jogoId', 'content', 'category', 'mediaUrl', 'mediaType', 'createdAt', 'updatedAt'],
        };

        if (filter.contentContains && filter.contentContains.trim() !== '') {
            opts.where = {
                content: { [Op.iLike]: `%${filter.contentContains.trim()}%` },
            };
        }

        const posts = await this.postRepository.findAll(opts);
        return posts.map((post) => toPublicPost(post));
    }

    async updatePost(id: number, userId: number, input: UpdatePostInput) {
        const post = await this.postRepository.findById(id);
        if (!post) throw new AppError('Post não encontrado', 404);
        if (post.userId !== userId) throw new AppError('Sem permissão para editar este post', 403);

        const updates: Partial<Pick<PostAttrs, 'content' | 'mediaUrl' | 'mediaType' | 'category'>> = {};

        if (input.content !== undefined) updates.content = normalizeContent(input.content);
        if (input.category !== undefined) updates.category = normalizeCategory(input.category);

        if (input.mediaUrl !== undefined || input.mediaType !== undefined) {
            const mediaUrl = input.mediaUrl !== undefined ? input.mediaUrl : post.mediaUrl;
            const mediaType = input.mediaType !== undefined ? input.mediaType : post.mediaType;
            Object.assign(updates, normalizeMedia(mediaUrl, mediaType));
        }

        if (Object.keys(updates).length === 0) return toPublicPost(post);

        await this.postRepository.updateById(id, updates);
        const updatedPost = await this.postRepository.findById(id);
        if (!updatedPost) throw new AppError('Post não encontrado', 404);
        return toPublicPost(updatedPost);
    }

    async listFeedPosts(limit = 6, requestingUserId?: number) {
        const posts = await this.postRepository.findAll({
            limit,
            order: [['createdAt', 'DESC']],
        });
        return this.enrichPosts(posts, requestingUserId);
    }

    async listFollowingTrending(followerId: number, limit = 3) {
        const followedUsers = await this.userFollowRepository.findFollowingUsers(followerId, 1000, 0);
        if (followedUsers.length === 0) return [];

        const followedIds = followedUsers.map((u) => u.id);

        const grouped = await Post.findAll({
            where: {
                userId: { [Op.in]: followedIds },
                jogoId: { [Op.ne]: null },
            } as any,
            attributes: [
                'jogoId',
                [sequelize.fn('COUNT', sequelize.col('Post.id')), 'postCount'],
            ],
            group: ['jogoId'],
            order: [[sequelize.fn('COUNT', sequelize.col('Post.id')), 'DESC']],
            limit: Math.min(limit, 10),
            raw: true,
        }) as unknown as { jogoId: number; postCount: string }[];

        if (grouped.length === 0) return [];

        const jogoIds = grouped.map((g) => g.jogoId);
        const jogos = await this.jogoRepository.findAll({
            where: { id: { [Op.in]: jogoIds } },
            attributes: ['id', 'title', 'imageUrl'],
        });

        const jogoMap = new Map(jogos.map((j) => [j.id, j]));

        return grouped
            .map((g) => {
                const jogo = jogoMap.get(g.jogoId);
                if (!jogo) return null;
                return {
                    id: jogo.id,
                    title: jogo.title,
                    imageUrl: jogo.imageUrl,
                    postCount: parseInt(String(g.postCount), 10),
                };
            })
            .filter((g): g is NonNullable<typeof g> => g !== null);
    }

    async listFollowingFeed(followerId: number, limit = 20) {
        const followedUsers = await this.userFollowRepository.findFollowingUsers(followerId, 1000, 0);
        if (followedUsers.length === 0) return [];

        const followedIds = followedUsers.map((u) => u.id);
        const posts = await this.postRepository.findAll({
            where: { userId: { [Op.in]: followedIds } } as any,
            limit: Math.min(limit, 50),
            order: [['createdAt', 'DESC']],
        });
        return this.enrichPosts(posts, followerId);
    }

    async listUserPosts(userId: number, requestingUserId?: number) {
        const posts = await this.postRepository.findAll({
            where: { userId } as any,
            order: [['createdAt', 'DESC']],
        });

        if (posts.length === 0) return [];

        const postIds = posts.map((p) => p.id);
        const jogoIds = posts.map((p) => p.jogoId).filter((id): id is number => id !== null);
        const user = await this.userRepository.findById(userId);

        const [jogos, ratings, likesCountGroup, userLikes, commentsCountMap] = await Promise.all([
            jogoIds.length > 0
                ? this.jogoRepository.findAll({
                    where: { id: { [Op.in]: jogoIds } },
                    attributes: ['id', 'title', 'imageUrl', 'tags'],
                })
                : Promise.resolve([]),
            jogoIds.length > 0
                ? UserRating.findAll({
                    where: { userId, jogoId: { [Op.in]: jogoIds } },
                    attributes: ['userId', 'jogoId', 'rating'],
                })
                : Promise.resolve([]),
            PostLike.findAll({
                where: { postId: { [Op.in]: postIds } },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['postId'],
                raw: true,
            }) as unknown as Promise<{ postId: number; count: string | number }[]>,
            requestingUserId
                ? PostLike.findAll({
                    where: { postId: { [Op.in]: postIds }, userId: requestingUserId },
                    attributes: ['postId'],
                    raw: true,
                })
                : Promise.resolve([]),
            CommentService.countByPostIds(postIds),
        ]);

        const jogoMap = new Map(jogos.map((j) => [j.id, j]));
        const ratingMap = new Map(ratings.map((r) => [`${r.userId}-${r.jogoId}`, r.rating]));
        const likesMap = new Map<number, number>();
        (likesCountGroup as any[]).forEach((g) => likesMap.set(g.postId, parseInt(String(g.count), 10)));
        const likedSet = new Set<number>();
        (userLikes as any[]).forEach((l) => likedSet.add(l.postId));

        return posts.map((p) => {
            const jogo = p.jogoId ? jogoMap.get(p.jogoId) ?? null : null;
            const rating = p.jogoId ? ratingMap.get(`${p.userId}-${p.jogoId}`) ?? null : null;
            const tagsFinais = parseCategoryTags(p.category);
            return {
                id: p.id,
                content: p.content,
                createdAt: p.createdAt,
                rating,
                user: user
                    ? { id: user.id, username: user.username ?? null, avatarUrl: user.avatarUrl ?? null, email: user.email }
                    : null,
                jogo: jogo ? { id: jogo.id, title: jogo.title, imageUrl: jogo.imageUrl, tags: tagsFinais } : null,
                likesCount: likesMap.get(p.id) ?? 0,
                liked: likedSet.has(p.id),
                commentsCount: commentsCountMap.get(p.id) ?? 0,
            };
        });
    }

    async likePost(userId: number, postId: number): Promise<{ success: boolean }> {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError('Post não encontrado', 404);

        const existingLike = await this.postLikeRepository.findOne(userId, postId);
        if (existingLike) {
            throw new AppError('Você já curtiu este post', 400);
        }

        await this.postLikeRepository.create(userId, postId);
        return { success: true };
    }

    async unlikePost(userId: number, postId: number): Promise<{ success: boolean }> {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError('Post não encontrado', 404);

        const existingLike = await this.postLikeRepository.findOne(userId, postId);
        if (!existingLike) {
            throw new AppError('Você não curtiu este post', 400);
        }

        await this.postLikeRepository.destroy(userId, postId);
        return { success: true };
    }

    async deletePost(id: number, userId: number) {
        const post = await this.postRepository.findById(id);
        if (!post) throw new AppError('Post não encontrado', 404);
        if (post.userId !== userId) throw new AppError('Sem permissão para excluir este post', 403);
        await this.postRepository.destroyById(id);
    }
}
