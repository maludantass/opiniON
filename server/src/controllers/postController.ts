import type { Request, Response } from 'express';
import { sendError, sendSuccess, handleError } from '../utils/httpResponse.js';
import { parseRouteId, requireAuthUserId } from '../utils/request.js';
import { PostService, type PostListFilter } from '../services/postService.js';

const postService = new PostService();

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = requireAuthUserId(req.authUserId);
        const data = await postService.createPost(authId, {
            content: req.body?.content,
            mediaUrl: req.body?.mediaUrl,
            mediaType: req.body?.mediaType,
            jogoId: req.body?.jogoId,
            category: req.body?.category,
        });
        sendSuccess(res, data, 201);
    } catch (e) {
        handleError(res, e);
    }
};

export const getFollowingTrending = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = requireAuthUserId(req.authUserId);
        const limit = Math.min(Number(req.query['limit'] ?? 3), 10);
        const data = await postService.listFollowingTrending(authId, Number.isFinite(limit) ? limit : 3);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getFollowingFeed = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = requireAuthUserId(req.authUserId);
        const limit = Math.min(Number(req.query['limit'] ?? 20), 50);
        const data = await postService.listFollowingFeed(authId, Number.isFinite(limit) ? limit : 20);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getFeedPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = Math.min(Number(req.query['limit'] ?? 20), 50);
        const requestingUserId = req.authUserId ? Number(req.authUserId) : undefined;
        const data = await postService.listFeedPosts(
            Number.isFinite(limit) ? limit : 6,
            requestingUserId,
        );
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: PostListFilter = {};
        if (req.query['limit'] !== undefined) filter.limit = Number(req.query['limit']);
        if (req.query['offset'] !== undefined) filter.offset = Number(req.query['offset']);
        if (typeof req.query['content'] === 'string') filter.contentContains = req.query['content'];
        
        if (
            (filter.limit !== undefined && !Number.isFinite(filter.limit)) ||
            (filter.offset !== undefined && !Number.isFinite(filter.offset))
        ) {
            sendError(res, 'limit e offset devem ser numéricos', 400);
            return;
        }
        const data = await postService.listPosts(filter);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseRouteId(req.params['id']);
        const requestingUserId = req.authUserId ? Number(req.authUserId) : undefined;
        const data = await postService.getPostById(id, requestingUserId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await postService.updatePost(id, authId, {
            content: req.body?.content,
            mediaUrl: req.body?.mediaUrl,
            mediaType: req.body?.mediaType,
            category: req.body?.category,
        });
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getMyPostForGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = requireAuthUserId(req.authUserId);
        const jogoId = parseRouteId(req.params['jogoId']);
        const data = await postService.getPostForGame(authId, jogoId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const getMyPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const authId = requireAuthUserId(req.authUserId);
        const data = await postService.listUserPosts(authId, authId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        await postService.deletePost(id, authId);
        sendSuccess(res, { deleted: true });
    } catch (e) {
        handleError(res, e);
    }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await postService.likePost(authId, id);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const unlikePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await postService.unlikePost(authId, id);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};
