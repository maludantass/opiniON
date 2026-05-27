import type { CreationAttributes } from 'sequelize';
import { CommunityInvite } from '../models/CommunityInvite.js';
import type { CommunityInviteAttrs, InviteStatus } from '../models/CommunityInvite.js';
import { Community } from '../models/Community.js';
import { User } from '../models/User.js';

export class CommunityInviteRepository {
    findById(id: number): Promise<CommunityInvite | null> {
        return CommunityInvite.findByPk(id);
    }

    findOne(communityId: number, inviteeId: number): Promise<CommunityInvite | null> {
        return CommunityInvite.findOne({ where: { communityId, inviteeId } });
    }

    findPendingForUser(inviteeId: number): Promise<CommunityInvite[]> {
        return CommunityInvite.findAll({
            where: { inviteeId, status: 'pending' },
            include: [
                { model: Community, as: 'community', attributes: ['id', 'name', 'imageUrl', 'type'] },
                { model: User, as: 'inviter', attributes: ['id', 'username', 'avatarUrl', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    create(attrs: Pick<CommunityInviteAttrs, 'communityId' | 'inviterId' | 'inviteeId'>): Promise<CommunityInvite> {
        return CommunityInvite.create({ ...attrs, status: 'pending' } as CreationAttributes<CommunityInvite>);
    }

    async updateStatus(id: number, status: InviteStatus): Promise<number> {
        const [affected] = await CommunityInvite.update({ status }, { where: { id } });
        return affected;
    }
}
