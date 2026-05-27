import type { CreationAttributes, FindOptions } from 'sequelize';
import { CommunityEvent } from '../models/CommunityEvent.js';
import type { CommunityEventAttrs } from '../models/CommunityEvent.js';
import { CommunityEventRsvp } from '../models/CommunityEventRsvp.js';

export class CommunityEventRepository {
    findById(id: number): Promise<CommunityEvent | null> {
        return CommunityEvent.findByPk(id);
    }

    findAll(options?: FindOptions<CommunityEvent>): Promise<CommunityEvent[]> {
        return CommunityEvent.findAll(options);
    }

    findByCommunity(communityId: number): Promise<CommunityEvent[]> {
        return CommunityEvent.findAll({
            where: { communityId },
            order: [['eventDate', 'ASC']],
        });
    }

    create(attrs: Omit<CommunityEventAttrs, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityEvent> {
        return CommunityEvent.create(attrs as CreationAttributes<CommunityEvent>);
    }

    destroyById(id: number): Promise<number> {
        return CommunityEvent.destroy({ where: { id } });
    }

    findRsvp(eventId: number, userId: number): Promise<CommunityEventRsvp | null> {
        return CommunityEventRsvp.findOne({ where: { eventId, userId } });
    }

    createRsvp(eventId: number, userId: number): Promise<CommunityEventRsvp> {
        return CommunityEventRsvp.create({ eventId, userId } as CreationAttributes<CommunityEventRsvp>);
    }

    destroyRsvp(eventId: number, userId: number): Promise<number> {
        return CommunityEventRsvp.destroy({ where: { eventId, userId } });
    }

    countRsvps(eventId: number): Promise<number> {
        return CommunityEventRsvp.count({ where: { eventId } });
    }
}
