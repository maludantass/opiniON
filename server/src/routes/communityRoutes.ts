import { Router } from 'express';
import * as c from '../controllers/communityController.js';
import { authJwt, authJwtOptional } from '../middleware/authJwt.js';

export class CommunityRoutes {
    readonly router: Router;

    constructor() {
        this.router = Router();
        this.register();
    }

    private register(): void {
        this.router.get('/', authJwtOptional(), c.listCommunities);
        this.router.get('/my', authJwt(), c.getMyCommunities);
        this.router.get('/invites', authJwt(), c.getMyInvites);
        this.router.post('/join/:code', authJwt(), c.joinByCode);
        this.router.post('/', authJwt(), c.createCommunity);

        this.router.get('/:id', authJwtOptional(), c.getCommunityById);
        this.router.put('/:id', authJwt(), c.updateCommunity);
        this.router.delete('/:id', authJwt(), c.deleteCommunity);

        this.router.post('/:id/join', authJwt(), c.joinCommunity);
        this.router.delete('/:id/leave', authJwt(), c.leaveCommunity);

        this.router.get('/:id/members', authJwtOptional(), c.getMembers);
        this.router.get('/:id/requests', authJwt(), c.getPendingRequests);
        this.router.post('/:id/requests/:userId/approve', authJwt(), c.approveRequest);
        this.router.delete('/:id/requests/:userId/reject', authJwt(), c.rejectRequest);
        this.router.delete('/:id/members/:userId/ban', authJwt(), c.banMember);

        this.router.post('/:id/invite', authJwt(), c.sendInvite);
        this.router.post('/invites/:inviteId/respond', authJwt(), c.respondInvite);

        this.router.get('/:id/invite-code', authJwt(), c.getInviteCode);
        this.router.post('/:id/invite-code/regenerate', authJwt(), c.regenerateInviteCode);

        this.router.get('/:id/posts', authJwtOptional(), c.getCommunityPosts);
        this.router.post('/:id/posts', authJwt(), c.createCommunityPost);
        this.router.delete('/:id/posts/:postId', authJwt(), c.deleteCommunityPost);

        this.router.get('/:id/events', authJwtOptional(), c.getCommunityEvents);
        this.router.post('/:id/events', authJwt(), c.createEvent);
        this.router.post('/:id/events/:eventId/rsvp', authJwt(), c.rsvpEvent);
        this.router.delete('/:id/events/:eventId/rsvp', authJwt(), c.unrsvpEvent);

        this.router.get('/:id/challenges', authJwtOptional(), c.getCommunityChallenge);
        this.router.post('/:id/challenges', authJwt(), c.createChallenge);
        this.router.post('/:id/challenges/:challengeId/contribute', authJwt(), c.contributeToChallenge);
    }
}
