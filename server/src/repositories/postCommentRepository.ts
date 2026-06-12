import type { CreationAttributes, FindOptions } from 'sequelize';
import { PostComment } from '../models/PostComment.js';

export class PostCommentRepository {
    findByPostId(postId: number, options?: Omit<FindOptions<PostComment>, 'where'>): Promise<PostComment[]> {
        return PostComment.findAll({
            where: { postId },
            order: [['createdAt', 'ASC']],
            ...options,
        });
    }

    findById(id: number): Promise<PostComment | null> {
        return PostComment.findByPk(id);
    }

    create(data: CreationAttributes<PostComment>): Promise<PostComment> {
        return PostComment.create(data);
    }

    destroyById(id: number): Promise<number> {
        return PostComment.destroy({ where: { id } });
    }
}
