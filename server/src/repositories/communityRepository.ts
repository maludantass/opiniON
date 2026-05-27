import type { CreationAttributes, FindOptions, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { Community } from '../models/Community.js';
import type { CommunityAttrs } from '../models/Community.js';

export class CommunityRepository {
    findById(id: number, options?: Omit<FindOptions<Community>, 'where'>): Promise<Community | null> {
        return Community.findByPk(id, options);
    }

    findAll(options?: FindOptions<Community>): Promise<Community[]> {
        return Community.findAll(options);
    }

    findByInviteCode(code: string): Promise<Community | null> {
        return Community.findOne({ where: { inviteCode: code } });
    }

    findPublic(search?: string, limit = 20, offset = 0): Promise<{ rows: Community[]; count: number }> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (search?.trim()) {
            const term = `%${search.trim()}%`;
            where[Op.or] = [
                { name: { [Op.iLike]: term } },
                { description: { [Op.iLike]: term } },
            ];
        }
        return Community.findAndCountAll({
            where: where as WhereOptions,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
    }

    create(attrs: Omit<CommunityAttrs, 'id' | 'createdAt' | 'updatedAt'>): Promise<Community> {
        return Community.create(attrs as CreationAttributes<Community>);
    }

    async updateById(id: number, values: Partial<Omit<CommunityAttrs, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>): Promise<number> {
        const [affected] = await Community.update(values, { where: { id } });
        return affected;
    }

    destroyById(id: number): Promise<number> {
        return Community.destroy({ where: { id } });
    }
}
