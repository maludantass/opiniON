import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import {
    buildColumnMap,
    passesSeedFilters,
    readCsvRows,
    rowToGameInput,
} from './gameSeedFilters.js';

const BATCH_SIZE = 500;

async function main() {
    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error('Uso: npx tsx src/scripts/seedGames.ts <caminho-do-csv>');
        process.exit(1);
    }

    console.log('📂 Lendo CSV (streaming)...');

    let col: ReturnType<typeof buildColumnMap> | null = null;
    let totalRows = 0;
    let selected = 0;
    const batch: CreationAttributes<Jogo>[] = [];

    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();

    let inserted = 0;

    for await (const row of readCsvRows(csvPath)) {
        if (!col) {
            col = buildColumnMap(row);
            continue;
        }

        totalRows++;
        if (!passesSeedFilters(row, col)) continue;

        batch.push(rowToGameInput(row, col) as CreationAttributes<Jogo>);
        selected++;

        if (batch.length >= BATCH_SIZE) {
            await Jogo.bulkCreate(batch.splice(0, batch.length));
            inserted += BATCH_SIZE;
            process.stdout.write(`\r💾 ${inserted.toLocaleString()} jogos inseridos...`);
        }
    }

    if (batch.length > 0) {
        await Jogo.bulkCreate(batch);
        inserted += batch.length;
    }

    console.log(`\n   Linhas lidas: ${totalRows.toLocaleString()}`);
    console.log(`✅ ${selected.toLocaleString()} jogos selecionados`);
    console.log(`🎮 Seed concluído! ${inserted.toLocaleString()} jogos inseridos.`);
    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
