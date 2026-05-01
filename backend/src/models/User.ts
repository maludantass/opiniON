import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export interface UserAttrs {
    id: number;
    email: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User extends Model<UserAttrs> implements UserAttrs {
    declare id: number;
    declare email: string;
    declare passwordHash: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
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
        },
        {
            sequelize,
            tableName: 'users',
            timestamps: true,
        },
    );
}
