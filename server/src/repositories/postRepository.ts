import type { CreationAttributes, DestroyOptions, FindOptions } from 'sequelize';
import type { Transaction } from 'sequelize';
import type { PostAttrs } from '../models/Post.js';
import { Post } from '../models/Post.js';

export class PostRepository {
    findById(
        id: number,
        options?: Omit<FindOptions<Post>, 'where'>,
    ): Promise<Post | null> {
        return Post.findByPk(id, options);
    }

    findAll(options?: FindOptions<Post>): Promise<Post[]> {
        return Post.findAll(options);
    }

    create(
        attrs: Pick<PostAttrs, 'userId' | 'content' | 'mediaUrl' | 'mediaType' | 'category'> & { jogoId?: number | null; communityId?: number | null },
        options?: { transaction?: Transaction },
    ): Promise<Post> {
        return Post.create(attrs as CreationAttributes<Post>, options);
    }

    async updateById(
        id: number,
        values: Partial<Pick<PostAttrs, 'content' | 'mediaUrl' | 'mediaType' | 'category'>>,
    ): Promise<number> {
        const [affected] = await Post.update(values, { where: { id } });
        return affected;
    }

    destroyById(
        id: number,
        options?: Omit<DestroyOptions<Post>, 'where'>,
    ): Promise<number> {
        return Post.destroy({ where: { id }, ...options });
    }
}