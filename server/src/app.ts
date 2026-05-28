import express from 'express';
import cors from 'cors';
import opinionRoutes from './routes/opinionRoutes.js';

const app = express();

// Em desenvolvimento permite qualquer origem; em producao usa CLIENT_URL
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL ?? 'http://localhost:5173']
    : true;

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

app.use('/api', opinionRoutes);

app.get('/', (_req, res) => {
    res.send('opiniON API is running!');
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[unhandled error]', err);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
});

export default app;
