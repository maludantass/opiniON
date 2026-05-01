import dotenv from 'dotenv';
import pg from 'pg';
import { Sequelize } from 'sequelize';
import { initUserModel } from '../models/User.js';

dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_NAME ?? 'opinion',
    process.env.DB_USER ?? 'postgres',
    process.env.DB_PASSWORD ?? 'password',
    {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        dialect: 'postgres',
        dialectModule: pg,
        logging: false,
    },
);

initUserModel(sequelize);
