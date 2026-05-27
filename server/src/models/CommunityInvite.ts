import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { Community } from './Community.js';
import { User } from './User.js';

export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface CommunityInviteAttrs {
    id: number;
    communityId: number;
    inviterId: number;
    inviteeId: number;
    status: InviteStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityInvite extends Model<CommunityInviteAttrs> implements CommunityInviteAttrs {
    declare id: number;
    declare communityId: number;
    declare inviterId: number;
    declare inviteeId: number;
    declare status: InviteStatus;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare inviter?: User;
    declare invitee?: User;
    declare community?: Community;
}

export function initCommunityInviteModel(sequelize: Sequelize): void {
    CommunityInvite.init(
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
            inviterId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            inviteeId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            status: {
                type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
                allowNull: false,
                defaultValue: 'pending',
            },
        },
        {
            sequelize,
            tableName: 'community_invites',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['communityId', 'inviteeId'] },
                { fields: ['communityId'] },
                { fields: ['inviteeId'] },
                { fields: ['status'] },
            ],
        },
    );
}

export function setupCommunityInviteAssociations(): void {
    CommunityInvite.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });
    CommunityInvite.belongsTo(User, { as: 'inviter', foreignKey: 'inviterId' });
    CommunityInvite.belongsTo(User, { as: 'invitee', foreignKey: 'inviteeId' });
    Community.hasMany(CommunityInvite, { as: 'invites', foreignKey: 'communityId' });
}
