import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { Jogo } from './Jogo.js';

export interface UserRatingAttrs {
    id: number;
    userId: number;
    jogoId: number;
    rating: number | null;
    favorited: boolean;
    listed: boolean;
    played: boolean;
    category: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export class UserRating extends Model<UserRatingAttrs> implements UserRatingAttrs {
    declare id: number;
    declare userId: number;
    declare jogoId: number;
    declare rating: number | null;
    declare favorited: boolean;
    declare listed: boolean;
    declare played: boolean;
    declare category: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initUserRatingModel(sequelize: Sequelize): void {
    UserRating.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            jogoId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            rating: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: { min: 1, max: 5 },
            },
            favorited: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            listed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            played: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            category: {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            tableName: 'user_ratings',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['userId', 'jogoId'] },
            ],
        },
    );
}

export function setupUserRatingAssociations(): void {
    UserRating.belongsTo(Jogo, { foreignKey: 'jogoId', as: 'jogo' });
}