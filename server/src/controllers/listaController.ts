import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Jogo } from '../models/Jogo.js';
import { Lista } from '../models/Lista.js';
import { handleError, sendError, sendSuccess } from '../utils/httpResponse.js';

export async function getMinhas(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const listas = await Lista.findAll({ where: { userId }, order: [['updatedAt', 'DESC']] });

        const allJogoIds = [...new Set(listas.flatMap(l => l.jogoIds))];
        const jogosMap = new Map<number, { id: number; title: string; imageUrl: string | null; tags: string[] }>();

        if (allJogoIds.length > 0) {
            const jogos = await Jogo.findAll({
                where: { id: { [Op.in]: allJogoIds } },
                attributes: ['id', 'title', 'imageUrl', 'tags'],
            });
            for (const j of jogos) jogosMap.set(j.id, j.toJSON() as any);
        }

        const result = listas.map(l => ({
            ...l.toJSON(),
            jogos: l.jogoIds.map(id => jogosMap.get(id)).filter(Boolean),
        }));

        sendSuccess(res, result);
    } catch (e) {
        handleError(res, e);
    }
}

export async function createLista(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const { title, description, type } = req.body as { title?: string; description?: string; type?: string };

        if (!title?.trim()) {
            sendError(res, 'Título é obrigatório', 400);
            return;
        }

        const lista = await Lista.create({
            userId,
            title: title.trim(),
            description: description?.trim() || null,
            type: type === 'private' ? 'private' : 'public',
            jogoIds: [],
        });

        sendSuccess(res, { ...lista.toJSON(), jogos: [] }, 201);
    } catch (e) {
        handleError(res, e);
    }
}

export async function updateLista(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const id = Number(req.params.id);
        const lista = await Lista.findOne({ where: { id, userId } });

        if (!lista) {
            sendError(res, 'Lista não encontrada', 404);
            return;
        }

        const { title, description, type, jogoIds } = req.body as Partial<{
            title: string;
            description: string | null;
            type: 'public' | 'private';
            jogoIds: number[];
        }>;

        await lista.update({
            ...(title !== undefined && { title: title.trim() }),
            ...(description !== undefined && { description }),
            ...(type !== undefined && { type }),
            ...(jogoIds !== undefined && { jogoIds }),
        });

        const jogos = lista.jogoIds.length > 0
            ? (await Jogo.findAll({
                where: { id: { [Op.in]: lista.jogoIds } },
                attributes: ['id', 'title', 'imageUrl', 'tags'],
            })).map(j => j.toJSON())
            : [];

        sendSuccess(res, { ...lista.toJSON(), jogos });
    } catch (e) {
        handleError(res, e);
    }
}

export async function deleteLista(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const id = Number(req.params.id);
        const lista = await Lista.findOne({ where: { id, userId } });

        if (!lista) {
            sendError(res, 'Lista não encontrada', 404);
            return;
        }

        await lista.destroy();
        sendSuccess(res, { deleted: true });
    } catch (e) {
        handleError(res, e);
    }
}

export async function addJogo(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const id = Number(req.params.id);
        const jogoId = Number(req.body.jogoId);

        if (!jogoId) { sendError(res, 'jogoId obrigatório', 400); return; }

        const lista = await Lista.findOne({ where: { id, userId } });
        if (!lista) { sendError(res, 'Lista não encontrada', 404); return; }

        if (!lista.jogoIds.includes(jogoId)) {
            await lista.update({ jogoIds: [...lista.jogoIds, jogoId] });
        }

        const jogos = lista.jogoIds.length > 0
            ? (await Jogo.findAll({
                where: { id: { [Op.in]: lista.jogoIds } },
                attributes: ['id', 'title', 'imageUrl', 'tags'],
            })).map(j => j.toJSON())
            : [];

        sendSuccess(res, { ...lista.toJSON(), jogos });
    } catch (e) {
        handleError(res, e);
    }
}

export async function removeJogo(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.authUserId!;
        const id = Number(req.params.id);
        const jogoId = Number(req.params.jogoId);

        const lista = await Lista.findOne({ where: { id, userId } });
        if (!lista) { sendError(res, 'Lista não encontrada', 404); return; }

        await lista.update({ jogoIds: lista.jogoIds.filter(j => j !== jogoId) });
        sendSuccess(res, lista);
    } catch (e) {
        handleError(res, e);
    }
}
