import type { CreationAttributes, FindOptions } from 'sequelize';
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
}
