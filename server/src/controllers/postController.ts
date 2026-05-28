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

export const getFeedPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = Math.min(Number(req.query['limit'] ?? 6), 20);
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
        const data = await postService.getPostById(id);
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
