import app from './app.js';
import dotenv from 'dotenv';
import { sequelize } from './config/sequelize.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ alter: true });
        console.log('[sequelize] tabelas users e jogos sincronizadas (alter, modo dev)');
    }
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

bootstrap().catch((err: unknown) => {
    console.error('Falha ao subir o servidor:', err);
    process.exit(1);
});
