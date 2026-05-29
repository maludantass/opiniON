import crypto from 'crypto';
import { Op } from 'sequelize';
import { AppError } from '../errors/AppError.js';
import { CommunityRepository } from '../repositories/communityRepository.js';
import { CommunityMemberRepository } from '../repositories/communityMemberRepository.js';
import { CommunityEventRepository } from '../repositories/communityEventRepository.js';
import { CommunityChallengeRepository } from '../repositories/communityChallengeRepository.js';
import { CommunityInviteRepository } from '../repositories/communityInviteRepository.js';
import { PostRepository } from '../repositories/postRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import type { CommunityType } from '../models/Community.js';
import { User } from '../models/User.js';

function generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex');
}

function normalizeName(name: unknown): string {
    if (typeof name !== 'string' || !name.trim()) {
        throw new AppError('Nome da comunidade é obrigatório', 400);
    }
    const n = name.trim();
    if (n.length > 100) throw new AppError('Nome deve ter no máximo 100 caracteres', 400);
    return n;
}

function normalizeType(type: unknown): CommunityType {
    if (type !== 'public' && type !== 'private' && type !== 'invite') {
        throw new AppError("Tipo deve ser 'public', 'private' ou 'invite'", 400);
    }
    return type;
}

export interface CreateCommunityInput {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    type: CommunityType;
    tags?: string[];
    games?: string[];
}

export interface UpdateCommunityInput {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    tags?: string[];
    games?: string[];
}

export class CommunityService {
    constructor(
        private readonly communityRepo = new CommunityRepository(),
        private readonly memberRepo = new CommunityMemberRepository(),
        private readonly eventRepo = new CommunityEventRepository(),
        private readonly challengeRepo = new CommunityChallengeRepository(),
        private readonly inviteRepo = new CommunityInviteRepository(),
        private readonly postRepo = new PostRepository(),
        private readonly userRepo = new UserRepository(),
    ) {}

    private async toCommunityPublic(community: Awaited<ReturnType<CommunityRepository['findById']>>, userId?: number) {
        if (!community) return null;
        const memberCount = await this.memberRepo.count(community.id);
        let memberStatus: string | null = null;
        if (userId) {
            const membership = await this.memberRepo.findOne(community.id, userId);
            memberStatus = membership?.status ?? null;
        }
        return {
            id: community.id,
            name: community.name,
            description: community.description,
            imageUrl: community.imageUrl,
            type: community.type,
            ownerId: community.ownerId,
            tags: community.tags,
            games: community.games,
            memberCount,
            memberStatus,
            createdAt: community.createdAt,
        };
    }

    async listCommunities(userId?: number, search?: string, limit = 20, offset = 0) {
        const { rows, count } = await this.communityRepo.findPublic(search, limit, offset);
        const ids = rows.map((c) => c.id);

        const memberCounts = await this.memberRepo.countBatch(ids);
        const userMemberships = userId && ids.length > 0
            ? await this.memberRepo.findBatch(ids, userId)
            : new Map<number, { status: string }>();

        const items = rows.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            imageUrl: c.imageUrl,
            type: c.type,
            ownerId: c.ownerId,
            tags: c.tags,
            games: c.games,
            memberCount: memberCounts.get(c.id) ?? 0,
            memberStatus: userMemberships.get(c.id)?.status ?? null,
            createdAt: c.createdAt,
        }));

        return { items, total: count };
    }

    async getMyCommunities(userId: number) {
        const memberships = await this.memberRepo.findAll({
            where: { userId, status: 'active' },
        });

        const communityIds = memberships.map((m) => m.communityId);
        if (communityIds.length === 0) return [];

        const communities = await this.communityRepo.findAll({
            where: { id: { [Op.in]: communityIds } },
            order: [['name', 'ASC']],
        });

        return Promise.all(communities.map((c) => this.toCommunityPublic(c, userId)));
    }

    async getCommunityById(id: number, userId?: number) {
        const community = await this.communityRepo.findById(id);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        return this.toCommunityPublic(community, userId);
    }

    async createCommunity(ownerId: number, input: CreateCommunityInput) {
        const type = normalizeType(input.type);
        const inviteCode = type === 'invite' ? generateInviteCode() : null;

        const community = await this.communityRepo.create({
            name: normalizeName(input.name),
            description: input.description?.trim() ?? null,
            imageUrl: input.imageUrl?.trim() ?? null,
            type,
            inviteCode,
            ownerId,
            tags: input.tags ?? [],
            games: input.games ?? [],
        });

        await this.memberRepo.create({ communityId: community.id, userId: ownerId, status: 'active' });

        return this.toCommunityPublic(community, ownerId);
    }

    async updateCommunity(id: number, ownerId: number, input: UpdateCommunityInput) {
        const community = await this.communityRepo.findById(id);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);

        const updates: Record<string, unknown> = {};
        if (input.name !== undefined) updates.name = normalizeName(input.name);
        if (input.description !== undefined) updates.description = input.description?.trim() ?? null;
        if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl?.trim() ?? null;
        if (input.tags !== undefined) updates.tags = input.tags;
        if (input.games !== undefined) updates.games = input.games;

        if (Object.keys(updates).length > 0) {
            await this.communityRepo.updateById(id, updates as Parameters<CommunityRepository['updateById']>[1]);
        }

        const updated = await this.communityRepo.findById(id);
        return this.toCommunityPublic(updated!, ownerId);
    }

    async deleteCommunity(id: number, ownerId: number) {
        const community = await this.communityRepo.findById(id);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);
        await this.communityRepo.destroyById(id);
    }

    async joinCommunity(communityId: number, userId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.type === 'invite') throw new AppError('Esta comunidade requer código de convite', 403);

        const existing = await this.memberRepo.findOne(communityId, userId);
        if (existing) {
            if (existing.status === 'active') throw new AppError('Você já é membro desta comunidade', 409);
            if (existing.status === 'banned') throw new AppError('Você foi banido desta comunidade', 403);
            if (existing.status === 'pending') throw new AppError('Sua solicitação já está pendente', 409);
        }

        const status = community.type === 'private' ? 'pending' : 'active';
        await this.memberRepo.create({ communityId, userId, status });

        return { status };
    }

    async joinByCode(code: string, userId: number) {
        const community = await this.communityRepo.findByInviteCode(code);
        if (!community) throw new AppError('Código de convite inválido', 404);

        const existing = await this.memberRepo.findOne(community.id, userId);
        if (existing) {
            if (existing.status === 'active') throw new AppError('Você já é membro desta comunidade', 409);
            if (existing.status === 'banned') throw new AppError('Você foi banido desta comunidade', 403);
        }

        if (existing?.status === 'pending') {
            await this.memberRepo.updateStatus(community.id, userId, 'active');
        } else {
            await this.memberRepo.create({ communityId: community.id, userId, status: 'active' });
        }

        return this.toCommunityPublic(community, userId);
    }

    async leaveCommunity(communityId: number, userId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId === userId) throw new AppError('O moderador não pode sair. Encerre a comunidade.', 400);

        const membership = await this.memberRepo.findOne(communityId, userId);
        if (!membership) throw new AppError('Você não é membro desta comunidade', 404);

        await this.memberRepo.destroy(communityId, userId);
    }

    async getMembers(communityId: number, requesterId?: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        await this.assertAccessible(community, requesterId);

        interface MemberWithUser {
            userId: number;
            status: string;
            createdAt: Date;
            user: User | null;
        }

        const members = await this.memberRepo.findAll({
            where: { communityId, status: 'active' },
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl', 'email'] }],
        }) as unknown as MemberWithUser[];

        return members.map((m) => ({
            userId: m.userId,
            status: m.status,
            joinedAt: m.createdAt,
            isOwner: m.userId === community.ownerId,
            user: m.user
                ? {
                      id: m.user.id,
                      username: m.user.username,
                      avatarUrl: m.user.avatarUrl,
                      email: m.user.email,
                  }
                : null,
        }));
    }

    async getPendingRequests(communityId: number, ownerId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);

        const requests = await this.memberRepo.findPendingRequests(communityId);
        const userIds = requests.map((r) => r.userId);
        if (userIds.length === 0) return [];

        const users = await this.userRepo.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id', 'username', 'avatarUrl', 'email'],
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        return requests.map((r) => ({
            userId: r.userId,
            requestedAt: r.createdAt,
            user: userMap.get(r.userId)
                ? {
                      id: userMap.get(r.userId)!.id,
                      username: userMap.get(r.userId)!.username,
                      avatarUrl: userMap.get(r.userId)!.avatarUrl,
                      email: userMap.get(r.userId)!.email,
                  }
                : null,
        }));
    }

    async approveRequest(communityId: number, ownerId: number, targetUserId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);

        const membership = await this.memberRepo.findOne(communityId, targetUserId);
        if (!membership || membership.status !== 'pending') {
            throw new AppError('Solicitação não encontrada', 404);
        }
        await this.memberRepo.updateStatus(communityId, targetUserId, 'active');
    }

    async rejectRequest(communityId: number, ownerId: number, targetUserId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);

        const membership = await this.memberRepo.findOne(communityId, targetUserId);
        if (!membership || membership.status !== 'pending') {
            throw new AppError('Solicitação não encontrada', 404);
        }
        await this.memberRepo.destroy(communityId, targetUserId);
    }

    async banMember(communityId: number, ownerId: number, targetUserId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);
        if (targetUserId === ownerId) throw new AppError('Não é possível banir o moderador', 400);

        const membership = await this.memberRepo.findOne(communityId, targetUserId);
        if (!membership) throw new AppError('Usuário não é membro desta comunidade', 404);

        await this.memberRepo.updateStatus(communityId, targetUserId, 'banned');
    }

    async sendInvite(communityId: number, inviterId: number, inviteeId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        const inviterMembership = await this.memberRepo.findOne(communityId, inviterId);
        if (!inviterMembership || inviterMembership.status !== 'active') {
            throw new AppError('Você precisa ser membro para convidar', 403);
        }

        const existing = await this.inviteRepo.findOne(communityId, inviteeId);
        if (existing) {
            if (existing.status === 'pending') throw new AppError('Convite já enviado', 409);
        }

        const existingMember = await this.memberRepo.findOne(communityId, inviteeId);
        if (existingMember?.status === 'active') throw new AppError('Usuário já é membro', 409);

        await this.inviteRepo.create({ communityId, inviterId, inviteeId });
    }

    async getMyInvites(userId: number) {
        const invites = await this.inviteRepo.findPendingForUser(userId);
        return invites.map((inv) => ({
            id: inv.id,
            communityId: inv.communityId,
            community: (inv as unknown as { community: { id: number; name: string; imageUrl: string | null; type: string } }).community,
            inviter: (inv as unknown as { inviter: { id: number; username: string | null; avatarUrl: string | null; email: string } }).inviter,
            status: inv.status,
            createdAt: inv.createdAt,
        }));
    }

    async respondInvite(inviteId: number, userId: number, accept: boolean) {
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite) throw new AppError('Convite não encontrado', 404);
        if (invite.inviteeId !== userId) throw new AppError('Sem permissão', 403);
        if (invite.status !== 'pending') throw new AppError('Convite já respondido', 409);

        await this.inviteRepo.updateStatus(inviteId, accept ? 'accepted' : 'rejected');

        if (accept) {
            const existing = await this.memberRepo.findOne(invite.communityId, userId);
            if (!existing) {
                await this.memberRepo.create({ communityId: invite.communityId, userId, status: 'active' });
            } else if (existing.status !== 'active') {
                await this.memberRepo.updateStatus(invite.communityId, userId, 'active');
            }
        }
    }

    async getCommunityPosts(communityId: number, requesterId?: number, limit = 20, offset = 0) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        await this.assertAccessible(community, requesterId);

        const posts = await this.postRepo.findAll({
            where: { communityId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const userIds = [...new Set(posts.map((p) => p.userId))];
        const users = userIds.length > 0
            ? await this.userRepo.findAll({
                  where: { id: { [Op.in]: userIds } },
                  attributes: ['id', 'username', 'avatarUrl', 'email'],
              })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        return posts.map((p) => {
            const user = userMap.get(p.userId);
            return {
                id: p.id,
                communityId: p.communityId,
                content: p.content,
                mediaUrl: p.mediaUrl,
                mediaType: p.mediaType,
                createdAt: p.createdAt,
                user: user ? { id: user.id, username: user.username, avatarUrl: user.avatarUrl, email: user.email } : null,
            };
        });
    }

    async createCommunityPost(communityId: number, userId: number, content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        const membership = await this.memberRepo.findOne(communityId, userId);
        if (!membership || membership.status !== 'active') {
            throw new AppError('Você precisa ser membro para publicar', 403);
        }

        if (!content?.trim()) throw new AppError('Conteúdo é obrigatório', 400);
        if (content.trim().length > 10000) throw new AppError('Conteúdo muito longo', 400);

        const post = await this.postRepo.create({
            userId,
            communityId,
            jogoId: null,
            category: null,
            content: content.trim(),
            mediaUrl: mediaUrl ?? null,
            mediaType: mediaType ?? null,
        });

        return { id: post.id, communityId: post.communityId, userId: post.userId, content: post.content, mediaUrl: post.mediaUrl, mediaType: post.mediaType, createdAt: post.createdAt };
    }

    async deleteCommunityPost(communityId: number, postId: number, userId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        const post = await this.postRepo.findById(postId);
        if (!post || post.communityId !== communityId) throw new AppError('Post não encontrado', 404);

        if (post.userId !== userId && community.ownerId !== userId) {
            throw new AppError('Sem permissão para excluir este post', 403);
        }

        await this.postRepo.destroyById(postId);
    }

    async getCommunityEvents(communityId: number, requesterId?: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        await this.assertAccessible(community, requesterId);

        const events = await this.eventRepo.findByCommunity(communityId);
        if (events.length === 0) return [];

        const eventIds = events.map((e) => e.id);
        const rsvpCounts = await this.eventRepo.findRsvpsBatch(eventIds);
        const userRsvps = requesterId
            ? await this.eventRepo.findUserRsvpsBatch(eventIds, requesterId)
            : new Set<number>();

        return events.map((evt) => ({
            id: evt.id,
            communityId: evt.communityId,
            creatorId: evt.creatorId,
            title: evt.title,
            description: evt.description,
            eventDate: evt.eventDate,
            rsvpCount: rsvpCounts.get(evt.id) ?? 0,
            userRsvp: userRsvps.has(evt.id),
            createdAt: evt.createdAt,
        }));
    }

    async createEvent(communityId: number, userId: number, title: string, description: string | null, eventDate: string) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        const membership = await this.memberRepo.findOne(communityId, userId);
        if (!membership || membership.status !== 'active') {
            throw new AppError('Você precisa ser membro para criar eventos', 403);
        }

        if (!title?.trim()) throw new AppError('Título é obrigatório', 400);
        if (title.trim().length > 200) throw new AppError('Título muito longo', 400);

        const date = new Date(eventDate);
        if (Number.isNaN(date.getTime())) throw new AppError('Data do evento inválida', 400);
        if (date < new Date()) throw new AppError('A data do evento deve ser no futuro', 400);

        const event = await this.eventRepo.create({
            communityId,
            creatorId: userId,
            title: title.trim(),
            description: description?.trim() ?? null,
            eventDate: date,
        });

        return { id: event.id, communityId: event.communityId, creatorId: event.creatorId, title: event.title, description: event.description, eventDate: event.eventDate, rsvpCount: 0, userRsvp: false, createdAt: event.createdAt };
    }

    async rsvpEvent(communityId: number, eventId: number, userId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        const membership = await this.memberRepo.findOne(communityId, userId);
        if (!membership || membership.status !== 'active') {
            throw new AppError('Você precisa ser membro para confirmar presença', 403);
        }

        const event = await this.eventRepo.findById(eventId);
        if (!event || event.communityId !== communityId) throw new AppError('Evento não encontrado', 404);

        const existing = await this.eventRepo.findRsvp(eventId, userId);
        if (existing) throw new AppError('Presença já confirmada', 409);

        await this.eventRepo.createRsvp(eventId, userId);
        return { confirmed: true };
    }

    async unrsvpEvent(communityId: number, eventId: number, userId: number) {
        const event = await this.eventRepo.findById(eventId);
        if (!event || event.communityId !== communityId) throw new AppError('Evento não encontrado', 404);

        await this.eventRepo.destroyRsvp(eventId, userId);
        return { confirmed: false };
    }

    async getCommunityChallenge(communityId: number, requesterId?: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        await this.assertAccessible(community, requesterId);

        const challenges = await this.challengeRepo.findByCommunity(communityId);
        if (challenges.length === 0) return [];

        const challengeIds = challenges.map((c) => c.id);
        const allContributions = await this.challengeRepo.findContributionsBatch(challengeIds);

        return challenges.map((ch) => {
            const contributions = allContributions.get(ch.id) ?? [];
            const userContribution = requesterId
                ? contributions.find((c) => c.userId === requesterId)?.contribution ?? 0
                : 0;
            return {
                id: ch.id,
                communityId: ch.communityId,
                creatorId: ch.creatorId,
                title: ch.title,
                description: ch.description,
                goal: ch.goal,
                currentProgress: ch.currentProgress,
                startDate: ch.startDate,
                endDate: ch.endDate,
                userContribution,
                contributorsCount: contributions.length,
                createdAt: ch.createdAt,
            };
        });
    }

    async createChallenge(communityId: number, userId: number, title: string, description: string | null, goal: number, startDate: string, endDate: string) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);

        if (community.ownerId !== userId) {
            throw new AppError('Apenas o criador da comunidade pode criar desafios', 403);
        }

        if (!title?.trim()) throw new AppError('Título é obrigatório', 400);
        if (goal < 1) throw new AppError('Meta deve ser maior que zero', 400);

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new AppError('Datas inválidas', 400);
        }
        if (end <= start) throw new AppError('Data de fim deve ser após a data de início', 400);

        const challenge = await this.challengeRepo.create({
            communityId,
            creatorId: userId,
            title: title.trim(),
            description: description?.trim() ?? null,
            goal,
            startDate: start,
            endDate: end,
        });

        return { id: challenge.id, communityId: challenge.communityId, creatorId: challenge.creatorId, title: challenge.title, description: challenge.description, goal: challenge.goal, currentProgress: 0, startDate: challenge.startDate, endDate: challenge.endDate, userContribution: 0, contributorsCount: 0, createdAt: challenge.createdAt };
    }

    async contributeToChallenge(communityId: number, challengeId: number, userId: number, amount: number) {
        const membership = await this.memberRepo.findOne(communityId, userId);
        if (!membership || membership.status !== 'active') {
            throw new AppError('Você precisa ser membro para contribuir', 403);
        }

        const challenge = await this.challengeRepo.findById(challengeId);
        if (!challenge || challenge.communityId !== communityId) throw new AppError('Desafio não encontrado', 404);

        const now = new Date();
        if (now < new Date(challenge.startDate) || now > new Date(challenge.endDate)) {
            throw new AppError('Desafio não está ativo no momento', 400);
        }

        if (!Number.isInteger(amount) || amount < 1) throw new AppError('Contribuição deve ser um número inteiro positivo', 400);

        const existing = await this.challengeRepo.findContribution(challengeId, userId);
        if (existing) throw new AppError('Você já contribuiu com este desafio', 400);

        // Limita o incremento para não ultrapassar a meta
        const remaining = Math.max(0, challenge.goal - challenge.currentProgress);
        const effectiveAmount = Math.min(amount, remaining);

        if (effectiveAmount > 0) {
            await this.challengeRepo.upsertContribution(challengeId, userId, effectiveAmount);
            await this.challengeRepo.incrementProgress(challengeId, effectiveAmount);
        } else {
            // Meta já atingida, apenas registra a contribuição simbólica
            await this.challengeRepo.upsertContribution(challengeId, userId, 0);
        }

        const updated = await this.challengeRepo.findById(challengeId);
        return { currentProgress: updated!.currentProgress, goal: updated!.goal };
    }

    async getCommunityInviteCode(communityId: number, ownerId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);
        if (community.type !== 'invite') throw new AppError('Esta comunidade não usa código de convite', 400);
        return { inviteCode: community.inviteCode };
    }

    async regenerateInviteCode(communityId: number, ownerId: number) {
        const community = await this.communityRepo.findById(communityId);
        if (!community) throw new AppError('Comunidade não encontrada', 404);
        if (community.ownerId !== ownerId) throw new AppError('Sem permissão', 403);
        if (community.type !== 'invite') throw new AppError('Esta comunidade não usa código de convite', 400);

        const newCode = generateInviteCode();
        await this.communityRepo.updateById(communityId, { inviteCode: newCode });
        return { inviteCode: newCode };
    }

    private async assertAccessible(community: { type: string; ownerId: number; id: number }, userId?: number) {
        if (community.type !== 'public') {
            if (!userId) throw new AppError('Acesso restrito', 403);
            if (community.ownerId !== userId) {
                const membership = await this.memberRepo.findOne(community.id, userId);
                if (!membership || membership.status !== 'active') {
                    throw new AppError('Você não é membro desta comunidade', 403);
                }
            }
        }
    }
}
