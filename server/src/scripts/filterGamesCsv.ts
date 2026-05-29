import fs from 'node:fs';
import path from 'node:path';
import {
    buildColumnMap,
    passesSeedFilters,
    readCsvRows,
    rowToCsv,
} from './gameSeedFilters.js';

async function main() {    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error('Uso: npx tsx src/scripts/filterGamesCsv.ts <caminho-do-csv>');
        process.exit(1);
    }

    const absPath = path.resolve(csvPath);
    const tempPath = `${absPath}.tmp`;

    console.log('📂 Filtrando CSV (streaming)...');

    let col = null as ReturnType<typeof buildColumnMap> | null;
    let totalRows = 0;
    let kept = 0;

    const output = fs.createWriteStream(tempPath, { encoding: 'utf-8' });

    for await (const row of readCsvRows(absPath)) {
        if (!col) {
            col = buildColumnMap(row);
            output.write(`${rowToCsv(row)}\n`);
            continue;
        }

        totalRows++;

        if (!passesSeedFilters(row, col)) continue;

        output.write(`${rowToCsv(row)}\n`);
        kept++;
    }

    await new Promise<void>((resolve, reject) => {
        output.end(() => resolve());
        output.on('error', reject);
    });

    fs.renameSync(tempPath, absPath);

    console.log(`   Linhas originais: ${totalRows.toLocaleString()}`);
    console.log(`✅ ${kept.toLocaleString()} jogos mantidos no CSV`);
    console.log(`🗑️  ${(totalRows - kept).toLocaleString()} linhas removidas`);
    console.log(`💾 Arquivo atualizado: ${absPath}`);
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
