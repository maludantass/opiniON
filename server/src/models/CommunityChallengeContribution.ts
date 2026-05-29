import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { CommunityChallenge } from './CommunityChallenge.js';
import { User } from './User.js';

export interface CommunityChallengeContributionAttrs {
    id: number;
    challengeId: number;
    userId: number;
    contribution: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityChallengeContribution
    extends Model<CommunityChallengeContributionAttrs>
    implements CommunityChallengeContributionAttrs
{
    declare id: number;
    declare challengeId: number;
    declare userId: number;
    declare contribution: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare user?: User;
}

export function initCommunityChallengeContributionModel(sequelize: Sequelize): void {
    CommunityChallengeContribution.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            challengeId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'community_challenges', key: 'id' },
                onDelete: 'CASCADE',
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            contribution: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            tableName: 'community_challenge_contributions',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['challengeId', 'userId'] },
                { fields: ['challengeId'] },
                { fields: ['userId'] },
            ],
        },
    );
}

export function setupCommunityChallengeContributionAssociations(): void {
    CommunityChallengeContribution.belongsTo(CommunityChallenge, { foreignKey: 'challengeId' });
    CommunityChallengeContribution.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    CommunityChallenge.hasMany(CommunityChallengeContribution, { as: 'contributions', foreignKey: 'challengeId' });
}
