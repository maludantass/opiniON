import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import { PostComment } from '../models/PostComment.js';
import { PostCommentRepository } from '../repositories/postCommentRepository.js';
import { PostRepository } from '../repositories/postRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { sequelize } from '../config/sequelize.js';

const MAX_CONTENT_LENGTH = 2000;

function normalizeContent(content: string | null | undefined): string {
    if (content === undefined || content === null) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }
    const normalized = content.trim();
    if (!normalized) {
        throw new AppError('Conteúdo é obrigatório', 400);
    }
    if (normalized.length > MAX_CONTENT_LENGTH) {
        throw new AppError(`Comentário deve ter no máximo ${MAX_CONTENT_LENGTH} caracteres`, 400);
    }
    return normalized;
}

function toPublicComment(comment: PostComment, user: { id: number; username: string | null; avatarUrl: string | null; email: string } | undefined) {
    return {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        createdAt: comment.createdAt,
        user: user
            ? { id: user.id, username: user.username ?? null, avatarUrl: user.avatarUrl ?? null, email: user.email }
            : null,
    };
}

export class CommentService {
    constructor(
        private readonly commentRepository = new PostCommentRepository(),
        private readonly postRepository = new PostRepository(),
        private readonly userRepository = new UserRepository(),
    ) {}

    async listComments(postId: number) {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError('Post não encontrado', 404);

        const comments = await this.commentRepository.findByPostId(postId);
        if (comments.length === 0) return [];

        const userIds = [...new Set(comments.map((c) => c.userId))];
        const users = await this.userRepository.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id', 'email', 'username', 'avatarUrl'],
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        return comments.map((c) => toPublicComment(c, userMap.get(c.userId)));
    }

    async createComment(userId: number, postId: number, content: string) {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError('Post não encontrado', 404);

        const normalized = normalizeContent(content);
        const comment = await this.commentRepository.create({ userId, postId, content: normalized });

        const user = await this.userRepository.findById(userId);
        return toPublicComment(comment, user ?? undefined);
    }

    async deleteComment(userId: number, postId: number, commentId: number) {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment || comment.postId !== postId) {
            throw new AppError('Comentário não encontrado', 404);
        }
        if (comment.userId !== userId) {
            throw new AppError('Sem permissão para excluir este comentário', 403);
        }
        await this.commentRepository.destroyById(commentId);
        return { deleted: true };
    }

    static async countByPostIds(postIds: number[]): Promise<Map<number, number>> {
        if (postIds.length === 0) return new Map();

        const grouped = await PostComment.findAll({
            where: { postId: { [Op.in]: postIds } },
            attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['postId'],
            raw: true,
        }) as unknown as { postId: number; count: string | number }[];

        const map = new Map<number, number>();
        grouped.forEach((g) => map.set(g.postId, parseInt(String(g.count), 10)));
        return map;
    }
}
