import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export interface JogoAttrs {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    tags: string[];
    releaseYear: number | null;
    platforms: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class Jogo extends Model<JogoAttrs> implements JogoAttrs {
    declare id: number;
    declare title: string;
    declare description: string | null;
    declare imageUrl: string | null;
    declare tags: string[];
    declare releaseYear: number | null;
    declare platforms: string[];
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initJogoModel(sequelize: Sequelize): void {
    Jogo.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            imageUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
            },
            tags: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
            releaseYear: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            platforms: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
        },
        {
            sequelize,
            tableName: 'jogos',
            timestamps: true,
        },
    );
}
