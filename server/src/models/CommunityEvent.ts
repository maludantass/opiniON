import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { Community } from './Community.js';
import { User } from './User.js';

export interface CommunityEventAttrs {
    id: number;
    communityId: number;
    creatorId: number;
    title: string;
    description: string | null;
    eventDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityEvent extends Model<CommunityEventAttrs> implements CommunityEventAttrs {
    declare id: number;
    declare communityId: number;
    declare creatorId: number;
    declare title: string;
    declare description: string | null;
    declare eventDate: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare creator?: User;
    declare community?: Community;
    declare rsvpCount?: number;
    declare userRsvp?: boolean;
}

export function initCommunityEventModel(sequelize: Sequelize): void {
    CommunityEvent.init(
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
            eventDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'community_events',
            timestamps: true,
            indexes: [
                { fields: ['communityId'] },
                { fields: ['creatorId'] },
                { fields: ['eventDate'] },
            ],
        },
    );
}

export function setupCommunityEventAssociations(): void {
    CommunityEvent.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
    CommunityEvent.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });
    Community.hasMany(CommunityEvent, { as: 'events', foreignKey: 'communityId' });
}
