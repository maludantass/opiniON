import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export interface PostAttrs {
    id: number;
    userId: number;
    jogoId: number | null;
    communityId: number | null;
    content: string;
    category: string | null;
    mediaUrl: string | null;
    mediaType: 'image' | 'video' | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Post extends Model<PostAttrs> implements PostAttrs {
    declare id: number;
    declare userId: number;
    declare jogoId: number | null;
    declare communityId: number | null;
    declare content: string;
    declare category: string | null;
    declare mediaUrl: string | null;
    declare mediaType: 'image' | 'video' | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initPostModel(sequelize: Sequelize): void {
    Post.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            jogoId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            communityId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'communities', key: 'id' },
                onDelete: 'CASCADE',
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            category: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            mediaUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
            },
            mediaType: {
                type: DataTypes.ENUM('image', 'video'),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'posts',
            timestamps: true,
            indexes: [
                { fields: ['userId'] },
                { fields: ['communityId'] },
                { fields: ['jogoId'] },
                { fields: ['createdAt'] },
            ],
        },
    );
}
