import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { Community } from './Community.js';
import { User } from './User.js';

export interface CommunityChallengeAttrs {
    id: number;
    communityId: number;
    creatorId: number;
    title: string;
    description: string | null;
    goal: number;
    currentProgress: number;
    startDate: Date;
    endDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityChallenge extends Model<CommunityChallengeAttrs> implements CommunityChallengeAttrs {
    declare id: number;
    declare communityId: number;
    declare creatorId: number;
    declare title: string;
    declare description: string | null;
    declare goal: number;
    declare currentProgress: number;
    declare startDate: Date;
    declare endDate: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare creator?: User;
}

export function initCommunityChallengeModel(sequelize: Sequelize): void {
    CommunityChallenge.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'communities', key: 'id' },
                onDelete: 'CASCADE',
            },
            creatorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            title: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            goal: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            currentProgress: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            startDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            endDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'community_challenges',
            timestamps: true,
            indexes: [
                { fields: ['communityId'] },
                { fields: ['creatorId'] },
            ],
        },
    );
}

export function setupCommunityChallengeAssociations(): void {
    CommunityChallenge.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
    CommunityChallenge.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });
    Community.hasMany(CommunityChallenge, { as: 'challenges', foreignKey: 'communityId' });
}
