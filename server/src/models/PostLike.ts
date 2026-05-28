import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { User } from './User.js';
import { Post } from './Post.js';

export interface PostLikeAttrs {
    id: number;
    userId: number;
    postId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class PostLike extends Model<PostLikeAttrs> implements PostLikeAttrs {
    declare id: number;
    declare userId: number;
    declare postId: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare user?: User;
    declare post?: Post;
}

export function initPostLikeModel(sequelize: Sequelize): void {
    PostLike.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            postId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'posts', key: 'id' },
                onDelete: 'CASCADE',
            },
        },
        {
            sequelize,
            tableName: 'post_likes',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['userId', 'postId'] },
                { fields: ['userId'] },
                { fields: ['postId'] },
            ],
        },
    );
}

export function setupPostLikeAssociations(): void {
    PostLike.belongsTo(User, {
        as: 'user',
        foreignKey: 'userId',
    });

    PostLike.belongsTo(Post, {
        as: 'post',
        foreignKey: 'postId',
    });
}
