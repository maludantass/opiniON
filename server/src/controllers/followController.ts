import type { Request, Response } from 'express';
import { FollowService } from '../services/followService.js';
import { handleError, sendSuccess } from '../utils/httpResponse.js';

const followService = new FollowService();

export const followUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.follow({
            followerId: req.authUserId,
            targetUserId: req.params['id'],
        });
        sendSuccess(res, data, 201);
    } catch (error) {
        handleError(res, error);
    }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.unfollow({
            followerId: req.authUserId,
            targetUserId: req.params['id'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getFollowStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.getFollowStatus({
            followerId: req.authUserId,
            targetUserId: req.params['id'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.listFollowers({
            userId: req.params['id'],
            limit: req.query['limit'],
            offset: req.query['offset'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.listFollowing({
            userId: req.params['id'],
            limit: req.query['limit'],
            offset: req.query['offset'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getUserWithFollowers = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const data = await followService.getUserWithFollowers({
            userId: req.params['id'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getUserWithFollowing = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const data = await followService.getUserWithFollowing({
            userId: req.params['id'],
        });
        sendSuccess(res, data);
    } catch (error) {
        handleError(res, error);
    }
};
