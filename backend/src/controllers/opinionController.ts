import type { Request, Response } from 'express';
import * as opinionModel from '../models/opinionModel.js';

export const getOpinion = async (req: Request, res: Response) => {
  try {
    const opinion = await opinionModel.getLatestOpinion();
    res.json(opinion);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
