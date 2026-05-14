import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import { getJwtExpiresIn, getJwtSecret } from '../config/jwt.js';
import type { User, UserAttrs } from '../models/User.js';
import { UserRepository } from '../repositories/userRepository.js';

function bcryptRounds(): number {
    const n = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
    return Number.isFinite(n) && n >= 10 ? n : 12;
}

export interface RegisterInput {
    email: string;
    password: string;
    username?: string | null;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface UserListFilter {
    limit?: number | undefined;
    offset?: number | undefined;
    emailContains?: string | undefined;
}

export interface UpdateUserInput {
    email?: string;
    password?: string;
    username?: string | null;
    avatarUrl?: string | null;
}

function toPublicUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        username: user.username ?? null,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

export class UserService {
    constructor(private readonly userRepository = new UserRepository()) {}

    async register(input: RegisterInput) {
        const email = input.email?.trim().toLowerCase();
        const password = input.password;

        if (!email || !password) {
            throw new AppError('Email e senha são obrigatórios', 400);
        }

        if (password.length < 6) {
            throw new AppError('Senha deve ter pelo menos 6 caracteres', 400);
        }

        const existing = await this.userRepository.findByEmail(email);

        if (existing) {
            throw new AppError('Email já cadastrado', 409);
        }

        const passwordHash = await bcrypt.hash(password, bcryptRounds());
        const username = input.username?.trim() || null;
        const user = await this.userRepository.create({ email, passwordHash, username });

        return toPublicUser(user);
    }

    async login(input: LoginInput) {
        const email = input.email?.trim().toLowerCase();
        const password = input.password;

        if (!email || !password) {
            throw new AppError('Email e senha são obrigatórios', 400);
        }

        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new AppError('Credenciais inválidas', 401);
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            throw new AppError('Credenciais inválidas', 401);
        }

        const signOptions = {
            expiresIn: getJwtExpiresIn(),
        } as jwt.SignOptions;

        const token = jwt.sign(
            { sub: user.id, email: user.email },
            getJwtSecret(),
            signOptions,
        );

        return { token, user: toPublicUser(user) };
    }

    async listUsers(filter: UserListFilter) {
        const limit = Math.min(filter.limit ?? 50, 100);
        const offset = filter.offset ?? 0;
        const opts: FindOptions<User> = {
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'email', 'createdAt', 'updatedAt'],
        };

        if (filter.emailContains && filter.emailContains.trim() !== '') {
            opts.where = {
                email: {
                    [Op.iLike]: `%${filter.emailContains.trim()}%`,
                },
            };
        }

        const users = await this.userRepository.findAll(opts);

        return users.map((user) => toPublicUser(user));
    }

    async updateUser(
        id: number,
        input: UpdateUserInput,
        authUserId: number,
    ) {
        if (id !== authUserId) {
            throw new AppError('Não autorizado a alterar este usuário', 403);
        }

        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const updates: Partial<Pick<UserAttrs, 'email' | 'passwordHash' | 'username' | 'avatarUrl'>> = {};

        if (input.email !== undefined) {
            const normalizedEmail = input.email.trim().toLowerCase();

            if (!normalizedEmail) {
                throw new AppError('Email inválido', 400);
            }

            if (normalizedEmail !== user.email) {
                const existing =
                    await this.userRepository.findByEmail(normalizedEmail);

                if (existing && existing.id !== id) {
                    throw new AppError('Email já em uso', 409);
                }
            }

            updates.email = normalizedEmail;
        }

        if (input.password !== undefined) {
            if (input.password.length < 6) {
                throw new AppError('Senha deve ter pelo menos 6 caracteres', 400);
            }

            const passwordHash = await bcrypt.hash(
                input.password,
                bcryptRounds(),
            );
            updates.passwordHash = passwordHash;
        }

        if (input.username !== undefined) {
            updates.username = input.username?.trim() || null;
        }

        if (input.avatarUrl !== undefined) {
            updates.avatarUrl = input.avatarUrl || null;
        }

        if (Object.keys(updates).length === 0) {
            return toPublicUser(user);
        }

        await this.userRepository.updateById(id, updates);

        const updatedUser = await this.userRepository.findById(id);

        if (!updatedUser) {
            throw new AppError('Usuário não encontrado', 404);
        }

        return toPublicUser(updatedUser);
    }

    async deleteUser(id: number, authUserId: number) {
        if (id !== authUserId) {
            throw new AppError('Não autorizado a remover este usuário', 403);
        }

        const deletedRowCount = await this.userRepository.destroyById(id);

        if (deletedRowCount === 0) {
            throw new AppError('Usuário não encontrado', 404);
        }
    }
}
