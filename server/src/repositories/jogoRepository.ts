import type { CreationAttributes, DestroyOptions, FindOptions } from 'sequelize';
import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import type { JogoAttrs } from '../models/Jogo.js';
import { Jogo } from '../models/Jogo.js';

export class JogoRepository {
    findById(
        id: number,
        options?: Omit<FindOptions<Jogo>, 'where'>,
    ): Promise<Jogo | null> {
        return Jogo.findByPk(id, options);
    }

    findAll(options?: FindOptions<Jogo>): Promise<Jogo[]> {
        return Jogo.findAll(options);
    }

    create(
        attrs: Pick<
            JogoAttrs,
            | 'title'
            | 'description'
            | 'imageUrl'
            | 'tags'
            | 'releaseYear'
            | 'platforms'
        >,
        options?: { transaction?: Transaction },
    ): Promise<Jogo> {
        return Jogo.create(attrs as CreationAttributes<Jogo>, options);
    }

    async updateById(
        id: number,
        values: Partial<
            Pick<
                JogoAttrs,
                | 'title'
                | 'description'
                | 'imageUrl'
                | 'tags'
                | 'releaseYear'
                | 'platforms'
            >
        >,
    ): Promise<number> {
        const [affected] = await Jogo.update(values, { where: { id } });
        return affected;
    }

    destroyById(
        id: number,
        options?: Omit<DestroyOptions<Jogo>, 'where'>,
    ): Promise<number> {
        return Jogo.destroy({ where: { id }, ...options });
    }

    findNextUnseenForUser(excludedJogoIds: number[]): Promise<Jogo | null> {
        const where =
            excludedJogoIds.length > 0
                ? { id: { [Op.notIn]: excludedJogoIds } }
                : {};

        return Jogo.findOne({
            where,
            order: sequelize.random(),
        });
    }

    countUnseenForUser(excludedJogoIds: number[]): Promise<number> {
        const where =
            excludedJogoIds.length > 0
                ? { id: { [Op.notIn]: excludedJogoIds } }
                : {};

        return Jogo.count({ where });
    }
}
