import type { FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import type { Post, PostAttrs } from '../models/Post.js';
import { PostRepository } from '../repositories/postRepository.js';

export type PostMediaType = 'image' | 'video';

export interface CreatePostInput {
    content: string;
    mediaUrl?: string | null;
    mediaType?: PostMediaType | null;
}

export interface UpdatePostInput {
    content?: string;
    mediaUrl?: string | null;
    mediaType?: PostMediaType | null;
}

export interface PostListFilter {
    limit?: number | undefined;
    offset?: number | undefined;
    contentContains?: string | undefined;
}

const MAX_CONTENT_LENGTH = 10000;

function normalizeContent(content: string | null | undefined): string {
    if (content === undefined || content === null) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }

    const normalized = content.trim();

    if (!normalized) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }

    if (normalized.length > MAX_CONTENT_LENGTH) {
        throw new AppError(
            `Conteúdo deve ter no máximo ${MAX_CONTENT_LENGTH} caracteres`,
            400,
        );
    }

    return normalized;
}

function normalizeMediaUrl(mediaUrl: string | null | undefined): string | null {
    if (mediaUrl === undefined || mediaUrl === null) {
        return null;
    }

    const normalized = mediaUrl.trim();

    if (!normalized) {
        return null;
    }

    if (normalized.length > 2048) {
        throw new AppError(
            'URL da mídia deve ter no máximo 2048 caracteres',
            400,
        );
    }

    try {
        const parsed = new URL(normalized);

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new AppError('URL da mídia deve usar http ou https', 400);
        }
    } catch (e) {
        if (e instanceof AppError) {
            throw e;
        }

        throw new AppError('URL da mídia inválida', 400);
    }

    return normalized;
}

function normalizeMediaType(
    mediaType: PostMediaType | null | undefined,
): PostMediaType | null {
    if (mediaType === undefined || mediaType === null) {
        return null;
    }

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
        throw new AppError(
            'Tipo de mídia é obrigatório quando a URL é informada',
            400,
        );
    }

    if (!normalizedUrl && normalizedType) {
        throw new AppError(
            'URL da mídia é obrigatória quando o tipo é informado',
            400,
        );
    }

    return {
        mediaUrl: normalizedUrl,
        mediaType: normalizedType,
    };
}

function toPublicPost(post: Post) {
    return {
        id: post.id,
        userId: post.userId,
        content: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
}

export class PostService {
    constructor(private readonly postRepository = new PostRepository()) {}

    async createPost(userId: number, input: CreatePostInput) {
        const media = normalizeMedia(input.mediaUrl, input.mediaType);
        const post = await this.postRepository.create({
            userId,
            content: normalizeContent(input.content),
            ...media,
        });

        return toPublicPost(post);
    }

    async getPostById(id: number) {
        const post = await this.postRepository.findById(id);

        if (!post) {
            throw new AppError('Post não encontrado', 404);
        }

        return toPublicPost(post);
    }

    async listPosts(filter: PostListFilter) {
        const limit = Math.min(filter.limit ?? 50, 100);
        const offset = filter.offset ?? 0;
        const opts: FindOptions<Post> = {
            limit,
            offset,
            order: [['id', 'DESC']],
            attributes: [
                'id',
                'userId',
                'content',
                'mediaUrl',
                'mediaType',
                'createdAt',
                'updatedAt',
            ],
        };

        if (filter.contentContains && filter.contentContains.trim() !== '') {
            opts.where = {
                content: {
                    [Op.iLike]: `%${filter.contentContains.trim()}%`,
                },
            };
        }

        const posts = await this.postRepository.findAll(opts);

        return posts.map((post) => toPublicPost(post));
    }

    async updatePost(id: number, userId: number, input: UpdatePostInput) {
        const post = await this.postRepository.findById(id);

        if (!post) {
            throw new AppError('Post não encontrado', 404);
        }

        if (post.userId !== userId) {
            throw new AppError('Sem permissão para editar este post', 403);
        }

        const updates: Partial<
            Pick<PostAttrs, 'content' | 'mediaUrl' | 'mediaType'>
        > = {};

        if (input.content !== undefined) {
            updates.content = normalizeContent(input.content);
        }

        if (input.mediaUrl !== undefined || input.mediaType !== undefined) {
            const mediaUrl =
                input.mediaUrl !== undefined ? input.mediaUrl : post.mediaUrl;
            const mediaType =
                input.mediaType !== undefined ? input.mediaType : post.mediaType;

            Object.assign(updates, normalizeMedia(mediaUrl, mediaType));
        }

        if (Object.keys(updates).length === 0) {
            return toPublicPost(post);
        }

        await this.postRepository.updateById(id, updates);

        const updatedPost = await this.postRepository.findById(id);

        if (!updatedPost) {
            throw new AppError('Post não encontrado', 404);
        }

        return toPublicPost(updatedPost);
    }

    async deletePost(id: number, userId: number) {
        const post = await this.postRepository.findById(id);

        if (!post) {
            throw new AppError('Post não encontrado', 404);
        }

        if (post.userId !== userId) {
            throw new AppError('Sem permissão para excluir este post', 403);
        }

        await this.postRepository.destroyById(id);
    }
}
