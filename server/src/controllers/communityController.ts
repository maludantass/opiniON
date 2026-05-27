import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError, sendSuccess } from '../utils/httpResponse.js';
import { CommunityService } from '../services/communityService.js';

const svc = new CommunityService();

function handleError(res: Response, e: unknown): Response {
    if (e instanceof AppError) return sendError(res, e.message, e.statusCode, e.details);
    console.error(e);
    return sendError(res, 'Erro interno no servidor', 500);
}

export const listCommunities = async (req: Request, res: Response): Promise<void> => {
    try {
        const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;
        const limit = Math.min(Number(req.query['limit'] ?? 20), 50);
        const offset = Number(req.query['offset'] ?? 0);
        const data = await svc.listCommunities(req.authUserId, search, limit, offset);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getMyCommunities = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.getMyCommunities(req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getMyInvites = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.getMyInvites(req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getCommunityById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        const data = await svc.getCommunityById(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const createCommunity = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.createCommunity(req.authUserId, {
            name: req.body?.name,
            description: req.body?.description,
            imageUrl: req.body?.imageUrl,
            type: req.body?.type,
            tags: req.body?.tags,
            games: req.body?.games,
        });
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const updateCommunity = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.updateCommunity(id, req.authUserId, {
            name: req.body?.name,
            description: req.body?.description,
            imageUrl: req.body?.imageUrl,
            tags: req.body?.tags,
            games: req.body?.games,
        });
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const deleteCommunity = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.deleteCommunity(id, req.authUserId);
        sendSuccess(res, { deleted: true });
    } catch (e) { handleError(res, e); }
};

export const joinCommunity = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.joinCommunity(id, req.authUserId);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const joinByCode = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const code = String(req.params['code'] ?? '');
        if (!code) { sendError(res, 'Código inválido', 400); return; }
        const data = await svc.joinByCode(code, req.authUserId);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const leaveCommunity = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.leaveCommunity(id, req.authUserId);
        sendSuccess(res, { left: true });
    } catch (e) { handleError(res, e); }
};

export const getMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        const data = await svc.getMembers(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getPendingRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.getPendingRequests(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const targetUserId = Number(req.params['userId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.approveRequest(id, req.authUserId, targetUserId);
        sendSuccess(res, { approved: true });
    } catch (e) { handleError(res, e); }
};

export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const targetUserId = Number(req.params['userId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.rejectRequest(id, req.authUserId, targetUserId);
        sendSuccess(res, { rejected: true });
    } catch (e) { handleError(res, e); }
};

export const banMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const targetUserId = Number(req.params['userId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.banMember(id, req.authUserId, targetUserId);
        sendSuccess(res, { banned: true });
    } catch (e) { handleError(res, e); }
};

export const sendInvite = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const inviteeId = Number(req.body?.inviteeId);
        if (!Number.isFinite(inviteeId)) { sendError(res, 'inviteeId inválido', 400); return; }
        await svc.sendInvite(id, req.authUserId, inviteeId);
        sendSuccess(res, { invited: true }, 201);
    } catch (e) { handleError(res, e); }
};

export const respondInvite = async (req: Request, res: Response): Promise<void> => {
    try {
        const inviteId = Number(req.params['inviteId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const accept = req.body?.accept === true || req.body?.accept === 'true';
        await svc.respondInvite(inviteId, req.authUserId, accept);
        sendSuccess(res, { accepted: accept });
    } catch (e) { handleError(res, e); }
};

export const getCommunityPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        const limit = Math.min(Number(req.query['limit'] ?? 20), 50);
        const offset = Number(req.query['offset'] ?? 0);
        const data = await svc.getCommunityPosts(id, req.authUserId, limit, offset);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const createCommunityPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.createCommunityPost(id, req.authUserId, req.body?.content, req.body?.mediaUrl, req.body?.mediaType);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const deleteCommunityPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const postId = Number(req.params['postId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        await svc.deleteCommunityPost(id, postId, req.authUserId);
        sendSuccess(res, { deleted: true });
    } catch (e) { handleError(res, e); }
};

export const getCommunityEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        const data = await svc.getCommunityEvents(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.createEvent(id, req.authUserId, req.body?.title, req.body?.description, req.body?.eventDate);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const rsvpEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const eventId = Number(req.params['eventId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.rsvpEvent(id, eventId, req.authUserId);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const unrsvpEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const eventId = Number(req.params['eventId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.unrsvpEvent(id, eventId, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getCommunityChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!Number.isFinite(id)) { sendError(res, 'Id inválido', 400); return; }
        const data = await svc.getCommunityChallenge(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const createChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.createChallenge(id, req.authUserId, req.body?.title, req.body?.description, Number(req.body?.goal), req.body?.startDate, req.body?.endDate);
        sendSuccess(res, data, 201);
    } catch (e) { handleError(res, e); }
};

export const contributeToChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        const challengeId = Number(req.params['challengeId']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.contributeToChallenge(id, challengeId, req.authUserId, Number(req.body?.amount ?? 1));
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const getInviteCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.getCommunityInviteCode(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};

export const regenerateInviteCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params['id']);
        if (!req.authUserId) { sendError(res, 'Não autenticado', 401); return; }
        const data = await svc.regenerateInviteCode(id, req.authUserId);
        sendSuccess(res, data);
    } catch (e) { handleError(res, e); }
};
