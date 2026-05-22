import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { User } from './User.js';

export interface UserFollowAttrs {
    id: number;
    followerId: number;
    followedId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class UserFollow extends Model<UserFollowAttrs> implements UserFollowAttrs {
    declare id: number;
    declare followerId: number;
    declare followedId: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare follower?: User;
    declare followed?: User;
}

export function initUserFollowModel(sequelize: Sequelize): void {
    UserFollow.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            followerId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            followedId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
        },
        {
            sequelize,
            tableName: 'user_follows',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['followerId', 'followedId'] },
                { fields: ['followerId'] },
                { fields: ['followedId'] },
            ],
        },
    );
}

export function setupUserFollowAssociations(): void {
    UserFollow.belongsTo(User, {
        as: 'follower',
        foreignKey: 'followerId',
    });

    UserFollow.belongsTo(User, {
        as: 'followed',
        foreignKey: 'followedId',
    });

    User.belongsToMany(User, {
        through: UserFollow,
        as: 'followers',
        foreignKey: 'followedId',
        otherKey: 'followerId',
    });

    User.belongsToMany(User, {
        through: UserFollow,
        as: 'following',
        foreignKey: 'followerId',
        otherKey: 'followedId',
    });
}
