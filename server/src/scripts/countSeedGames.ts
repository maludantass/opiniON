import {
    MIN_POSITIVE_RATIO,
    MIN_TOTAL_REVIEWS,
    buildColumnMap,
    isAdultContent,
    passesSeedFilters,
    readCsvRows,
} from './gameSeedFilters.js';

async function main() {
    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error('Uso: npx tsx src/scripts/countSeedGames.ts <caminho-do-csv>');
        process.exit(1);
    }

    console.log('📂 Contando jogos (streaming)...');

    let col = null as ReturnType<typeof buildColumnMap> | null;
    let totalRows = 0;
    let selected = 0;
    let skippedAdult = 0;

    for await (const row of readCsvRows(csvPath)) {
        if (!col) {
            col = buildColumnMap(row);
            continue;
        }

        totalRows++;

        const name = row[col.NAME]?.trim() ?? '';
        const imageUrl = row[col.HEADER_IMAGE]?.trim() ?? '';
        const positive = Number.parseInt(row[col.POSITIVE] ?? '0', 10) || 0;
        const negative = Number.parseInt(row[col.NEGATIVE] ?? '0', 10) || 0;
        const genres = row[col.GENRES]?.trim() ?? '';
        const tags = row[col.TAGS]?.trim() ?? '';
        const categories = row[col.CATEGORIES]?.trim() ?? '';

        if (!name) continue;
        if (!imageUrl.startsWith('http')) continue;
        if (/playtest/i.test(name)) continue;
        if (!genres && !tags) continue;

        const adult = isAdultContent({ title: name, genres, tags, categories });
        if (adult) {
            skippedAdult++;
            continue;
        }

        if (!passesSeedFilters(row, col)) continue;

        selected++;
    }

    console.log(`   Linhas no dataset: ${totalRows.toLocaleString()}`);
    console.log(
        `🎯 Filtro: ≥ ${MIN_POSITIVE_RATIO * 100}% positivas, ≥ ${MIN_TOTAL_REVIEWS} reviews, sem conteúdo adulto`,
    );
    console.log(`✅ ${selected.toLocaleString()} jogos passariam no seed`);
    console.log(`🚫 ${skippedAdult.toLocaleString()} excluídos por conteúdo adulto`);
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
