import type { CreationAttributes } from 'sequelize';
import { CommunityChallenge } from '../models/CommunityChallenge.js';
import type { CommunityChallengeAttrs } from '../models/CommunityChallenge.js';
import { CommunityChallengeContribution } from '../models/CommunityChallengeContribution.js';

export class CommunityChallengeRepository {
    findById(id: number): Promise<CommunityChallenge | null> {
        return CommunityChallenge.findByPk(id);
    }

    findByCommunity(communityId: number): Promise<CommunityChallenge[]> {
        return CommunityChallenge.findAll({
            where: { communityId },
            order: [['createdAt', 'DESC']],
        });
    }

    create(attrs: Omit<CommunityChallengeAttrs, 'id' | 'currentProgress' | 'createdAt' | 'updatedAt'>): Promise<CommunityChallenge> {
        return CommunityChallenge.create(attrs as CreationAttributes<CommunityChallenge>);
    }

    async incrementProgress(id: number, amount: number): Promise<void> {
        await CommunityChallenge.increment({ currentProgress: amount }, { where: { id } });
    }

    findContribution(challengeId: number, userId: number): Promise<CommunityChallengeContribution | null> {
        return CommunityChallengeContribution.findOne({ where: { challengeId, userId } });
    }

    findContributions(challengeId: number): Promise<CommunityChallengeContribution[]> {
        return CommunityChallengeContribution.findAll({ where: { challengeId } });
    }

    async upsertContribution(challengeId: number, userId: number, amount: number): Promise<number> {
        const existing = await this.findContribution(challengeId, userId);
        if (existing) {
            const delta = amount;
            const [affected] = await CommunityChallengeContribution.update(
                { contribution: existing.contribution + delta },
                { where: { challengeId, userId } },
            );
            return affected;
        }
        await CommunityChallengeContribution.create(
            { challengeId, userId, contribution: amount } as CreationAttributes<CommunityChallengeContribution>,
        );
        return 1;
    }
}
