import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export interface PostAttrs {
    id: number;
    userId: number;
    content: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'video' | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Post extends Model<PostAttrs> implements PostAttrs {
    declare id: number;
    declare userId: number;
    declare content: string;
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
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
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
        },
    );
}
