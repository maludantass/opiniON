import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { User } from './User.js';
import { Post } from './Post.js';

export interface PostCommentAttrs {
    id: number;
    userId: number;
    postId: number;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class PostComment extends Model<PostCommentAttrs> implements PostCommentAttrs {
    declare id: number;
    declare userId: number;
    declare postId: number;
    declare content: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare user?: User;
    declare post?: Post;
}

export function initPostCommentModel(sequelize: Sequelize): void {
    PostComment.init(
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
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'post_comments',
            timestamps: true,
            indexes: [
                { fields: ['postId'] },
                { fields: ['userId'] },
                { fields: ['createdAt'] },
            ],
        },
    );
}

export function setupPostCommentAssociations(): void {
    PostComment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    PostComment.belongsTo(Post, { as: 'post', foreignKey: 'postId' });
}
