import type { Request, Response } from 'express';
import { sendSuccess, handleError } from '../utils/httpResponse.js';
import { parseRouteId, requireAuthUserId } from '../utils/request.js';
import { CommentService } from '../services/commentService.js';

const commentService = new CommentService();

export const getPostComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = parseRouteId(req.params['id']);
        const data = await commentService.listComments(postId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};

export const createPostComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = parseRouteId(req.params['id']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await commentService.createComment(authId, postId, req.body?.content);
        sendSuccess(res, data, 201);
    } catch (e) {
        handleError(res, e);
    }
};

export const deletePostComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = parseRouteId(req.params['id']);
        const commentId = parseRouteId(req.params['commentId']);
        const authId = requireAuthUserId(req.authUserId);
        const data = await commentService.deleteComment(authId, postId, commentId);
        sendSuccess(res, data);
    } catch (e) {
        handleError(res, e);
    }
};
