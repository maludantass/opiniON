import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export type CommunityType = 'public' | 'private' | 'invite';

export interface CommunityAttrs {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    type: CommunityType;
    inviteCode: string | null;
    ownerId: number;
    tags: string[];
    games: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class Community extends Model<CommunityAttrs> implements CommunityAttrs {
    declare id: number;
    declare name: string;
    declare description: string | null;
    declare imageUrl: string | null;
    declare type: CommunityType;
    declare inviteCode: string | null;
    declare ownerId: number;
    declare tags: string[];
    declare games: string[];
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initCommunityModel(sequelize: Sequelize): void {
    Community.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            imageUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
            },
            type: {
                type: DataTypes.ENUM('public', 'private', 'invite'),
                allowNull: false,
                defaultValue: 'public',
            },
            inviteCode: {
                type: DataTypes.STRING(64),
                allowNull: true,
                unique: true,
            },
            ownerId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            tags: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
            games: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
        },
        {
            sequelize,
            tableName: 'communities',
            timestamps: true,
            indexes: [
                { fields: ['ownerId'] },
                { fields: ['type'] },
            ],
        },
    );
}
