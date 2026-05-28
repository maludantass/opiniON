import type { CreationAttributes, FindOptions } from 'sequelize';
import { fn, col, Op } from 'sequelize';
import { CommunityMember } from '../models/CommunityMember.js';
import type { CommunityMemberAttrs, MemberStatus } from '../models/CommunityMember.js';

export class CommunityMemberRepository {
    findById(id: number): Promise<CommunityMember | null> {
        return CommunityMember.findByPk(id);
    }

    findAll(options?: FindOptions<CommunityMember>): Promise<CommunityMember[]> {
        return CommunityMember.findAll(options);
    }

    findOne(communityId: number, userId: number): Promise<CommunityMember | null> {
        return CommunityMember.findOne({ where: { communityId, userId } });
    }

    count(communityId: number, status: MemberStatus = 'active'): Promise<number> {
        return CommunityMember.count({ where: { communityId, status } });
    }

    create(attrs: Pick<CommunityMemberAttrs, 'communityId' | 'userId' | 'status'>): Promise<CommunityMember> {
        return CommunityMember.create(attrs as CreationAttributes<CommunityMember>);
    }

    async updateStatus(communityId: number, userId: number, status: MemberStatus): Promise<number> {
        const [affected] = await CommunityMember.update({ status }, { where: { communityId, userId } });
        return affected;
    }

    destroy(communityId: number, userId: number): Promise<number> {
        return CommunityMember.destroy({ where: { communityId, userId } });
    }

    findPendingRequests(communityId: number): Promise<CommunityMember[]> {
        return CommunityMember.findAll({ where: { communityId, status: 'pending' } });
    }

    countByUserId(userId: number, status: MemberStatus = 'active'): Promise<number> {
        return CommunityMember.count({ where: { userId, status } });
    }

    async countBatch(communityIds: number[]): Promise<Map<number, number>> {
        if (communityIds.length === 0) return new Map();
        const results = await CommunityMember.findAll({
            where: { communityId: { [Op.in]: communityIds }, status: 'active' },
            attributes: ['communityId', [fn('COUNT', col('id')), 'count']],
            group: ['communityId'],
            raw: true,
        }) as unknown as Array<{ communityId: number; count: string }>;
        return new Map(results.map((r) => [r.communityId, parseInt(r.count, 10)]));
    }

    async findBatch(communityIds: number[], userId: number): Promise<Map<number, CommunityMember>> {
        if (communityIds.length === 0) return new Map();
        const results = await CommunityMember.findAll({
            where: { communityId: { [Op.in]: communityIds }, userId },
        });
        return new Map(results.map((m) => [m.communityId, m]));
    }
}
