import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { Community } from './Community.js';
import { User } from './User.js';

export type MemberStatus = 'pending' | 'active' | 'banned';

export interface CommunityMemberAttrs {
    id: number;
    communityId: number;
    userId: number;
    status: MemberStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CommunityMember extends Model<CommunityMemberAttrs> implements CommunityMemberAttrs {
    declare id: number;
    declare communityId: number;
    declare userId: number;
    declare status: MemberStatus;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare user?: User;
    declare community?: Community;
}

export function initCommunityMemberModel(sequelize: Sequelize): void {
    CommunityMember.init(
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
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            status: {
                type: DataTypes.ENUM('pending', 'active', 'banned'),
                allowNull: false,
                defaultValue: 'active',
            },
        },
        {
            sequelize,
            tableName: 'community_members',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['communityId', 'userId'] },
                { fields: ['communityId'] },
                { fields: ['userId'] },
                { fields: ['status'] },
            ],
        },
    );
}

export function setupCommunityMemberAssociations(): void {
    CommunityMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    CommunityMember.belongsTo(Community, { as: 'community', foreignKey: 'communityId' });
    Community.hasMany(CommunityMember, { as: 'members', foreignKey: 'communityId' });
    User.hasMany(CommunityMember, { as: 'communityMemberships', foreignKey: 'userId' });
}
