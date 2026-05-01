import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    console.warn('[jwt] JWT_SECRET ausente — defina em .env');
}

export function getJwtSecret(): string {
    if (!secret || secret.trim() === '') {
        throw new Error('JWT_SECRET não configurado');
    }
    return secret;
}

export function getJwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? '7d';
}
