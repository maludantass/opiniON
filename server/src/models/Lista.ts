import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

export type ListaType = 'public' | 'private';

export interface ListaAttrs {
    id: number;
    userId: number;
    title: string;
    description: string | null;
    type: ListaType;
    jogoIds: number[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class Lista extends Model<ListaAttrs> implements ListaAttrs {
    declare id: number;
    declare userId: number;
    declare title: string;
    declare description: string | null;
    declare type: ListaType;
    declare jogoIds: number[];
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export function initListaModel(sequelize: Sequelize): void {
    Lista.init(
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            title: { type: DataTypes.STRING(200), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            type: {
                type: DataTypes.ENUM('public', 'private'),
                allowNull: false,
                defaultValue: 'public',
            },
            jogoIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        },
        {
            sequelize,
            tableName: 'listas',
            timestamps: true,
            indexes: [{ fields: ['userId'] }],
        },
    );
}
