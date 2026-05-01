import type { CreationAttributes, DestroyOptions, FindOptions } from 'sequelize';
import type { Transaction } from 'sequelize';
import type { UserAttrs } from '../models/User.js';
import { User } from '../models/User.js';

export class UserRepository {
    findById(
        id: number,
        options?: Omit<FindOptions<User>, 'where'>,
    ): Promise<User | null> {
        return User.findByPk(id, options);
    }

    findByEmail(
        email: string,
        options?: Omit<FindOptions<User>, 'where'>,
    ): Promise<User | null> {
        return User.findOne({ where: { email }, ...options });
    }

    findAll(options?: FindOptions<User>): Promise<User[]> {
        return User.findAll(options);
    }

    create(
        attrs: Pick<UserAttrs, 'email' | 'passwordHash'>,
        options?: { transaction?: Transaction },
    ): Promise<User> {
        return User.create(attrs as CreationAttributes<User>, options);
    }

    async updateById(
        id: number,
        values: Partial<Pick<UserAttrs, 'email' | 'passwordHash'>>,
    ): Promise<number> {
        const [affected] = await User.update(values, { where: { id } });
        return affected;
    }

    destroyById(
        id: number,
        options?: Omit<DestroyOptions<User>, 'where'>,
    ): Promise<number> {
        return User.destroy({ where: { id }, ...options });
    }
}
