import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export interface UserAttrs {
    id: number;
    email: string;
    passwordHash: string;
    username?: string | null;
    avatarUrl?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User extends Model<UserAttrs> implements UserAttrs {
    declare id: number;
    declare email: string;
    declare passwordHash: string;
    declare username: string | null;
    declare avatarUrl: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    declare followers?: User[];
    declare following?: User[];
}

const publicUserAttributes = ['id', 'username', 'avatarUrl'] as const;

export function setupUserFollowScopes(): void {
    User.addScope('withFollowers', {
        include: [
            {
                model: User,
                as: 'followers',
                attributes: [...publicUserAttributes],
                through: { attributes: [] },
            },
        ],
    });

    User.addScope('withFollowing', {
        include: [
            {
                model: User,
                as: 'following',
                attributes: [...publicUserAttributes],
                through: { attributes: [] },
            },
        ],
    });

    User.addScope('withFollowRelations', {
        include: [
            {
                model: User,
                as: 'followers',
                attributes: [...publicUserAttributes],
                through: { attributes: [] },
            },
            {
                model: User,
                as: 'following',
                attributes: [...publicUserAttributes],
                through: { attributes: [] },
            },
        ],
    });
}

export function initUserModel(sequelize: Sequelize): void {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            username: {
                type: DataTypes.STRING(60),
                allowNull: true,
                defaultValue: null,
            },
            avatarUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            tableName: 'users',
            timestamps: true,
        },
    );
}
