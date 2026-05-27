import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { CommunityEvent } from './CommunityEvent.js';
import { User } from './User.js';

export interface CommunityEventRsvpAttrs {
    id: number;
    eventId: number;
    userId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityEventRsvp extends Model<CommunityEventRsvpAttrs> implements CommunityEventRsvpAttrs {
    declare id: number;
    declare eventId: number;
    declare userId: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initCommunityEventRsvpModel(sequelize: Sequelize): void {
    CommunityEventRsvp.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            eventId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'community_events', key: 'id' },
                onDelete: 'CASCADE',
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
        },
        {
            sequelize,
            tableName: 'community_event_rsvps',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['eventId', 'userId'] },
                { fields: ['eventId'] },
                { fields: ['userId'] },
            ],
        },
    );
}

export function setupCommunityEventRsvpAssociations(): void {
    CommunityEventRsvp.belongsTo(CommunityEvent, { foreignKey: 'eventId' });
    CommunityEventRsvp.belongsTo(User, { foreignKey: 'userId' });
    CommunityEvent.hasMany(CommunityEventRsvp, { as: 'rsvps', foreignKey: 'eventId' });
}
