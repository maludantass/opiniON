import fs from 'fs';
import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';

// ── Configuração ──────────────────────────────────────────────────────────────

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
    console.error('Uso: npx tsx src/scripts/seedGames.ts <caminho-do-csv>');
    process.exit(1);
}

const MAX_GAMES = 200;         // 200 jogos é mais que suficiente para a plataforma
const MIN_POSITIVE_REVIEWS = 50; // só jogos com ao menos 50 reviews positivos

// ── Parser de CSV com suporte a campos multi-linha e aspas escapadas ──────────

function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const ch = content[i]!;

        if (ch === '"') {
            if (inQuotes && content[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            row.push(field);
            field = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && content[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }

    if (row.length > 0 || field) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

// ── Helpers de transformação ──────────────────────────────────────────────────

function extractYear(dateStr: string): number | null {
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
}

function parsePlatforms(win: string, mac: string, linux: string): string[] {
    const platforms: string[] = [];
    if (win.trim().toLowerCase() === 'true') platforms.push('Windows');
    if (mac.trim().toLowerCase() === 'true') platforms.push('macOS');
    if (linux.trim().toLowerCase() === 'true') platforms.push('Linux');
    return platforms;
}

function parseTags(genres: string, tags: string): string[] {
    const seen = new Set<string>();
    for (const raw of [...genres.split(','), ...tags.split(',')]) {
        const t = raw.trim();
        if (t) seen.add(t);
    }
    return [...seen].slice(0, 10);
}

function truncate(str: string, max: number): string {
    return str.length <= max ? str : str.slice(0, max).trimEnd() + '…';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('📂 Lendo primeiros 80 MB do CSV...');
    const SAMPLE_BYTES = 80 * 1024 * 1024;
    const fd = fs.openSync(CSV_PATH as string, 'r');
    const buf = Buffer.alloc(SAMPLE_BYTES);
    const bytesRead = fs.readSync(fd, buf, 0, SAMPLE_BYTES, 0);
    fs.closeSync(fd);
    const content = buf.subarray(0, bytesRead).toString('utf-8');

    console.log('⚙️  Parseando...');
    const rows = parseCSV(content);
    // descarta o header e a última linha (pode estar incompleta)
    const header = rows[0]!;
    const dataRows = rows.slice(1, -1);

    console.log(`   Linhas lidas na amostra: ${dataRows.length.toLocaleString()}`);
    console.log(`   Total de colunas detectadas: ${header.length}`);

    // ── Detecta índices pelo nome no cabeçalho ────────────────────────────────
    // O dataset tem uma coluna extra nos dados ("Discount" e "DLC count" separadas,
    // mas o header as une como "DiscountDLC count"). Isso desloca +1 tudo após col 7.
    const col = (name: string): number => {
        const idx = header.indexOf(name);
        if (idx === -1) throw new Error(`Coluna não encontrada: "${name}"`);
        return idx;
    };
    const shifted = (name: string) => col(name) + 1; // correção do deslocamento

    const COL = {
        NAME:         col('Name'),           // col 1 — sem deslocamento
        RELEASE_DATE: col('Release date'),   // col 2 — sem deslocamento
        ABOUT:        shifted('About the game'),   // 8+1=9
        HEADER_IMAGE: shifted('Header image'),     // 12+1=13
        WINDOWS:      shifted('Windows'),           // 16+1=17
        MAC:          shifted('Mac'),               // 17+1=18
        LINUX:        shifted('Linux'),             // 18+1=19
        POSITIVE:     shifted('Positive'),          // 22+1=23
        GENRES:       shifted('Genres'),            // 35+1=36
        TAGS:         shifted('Tags'),              // 36+1=37
    };

    console.log('   Mapeamento corrigido:', COL);

    // ── Coleta jogos que passam nos filtros ───────────────────────────────────
    type GameInput = Pick<CreationAttributes<Jogo>, 'title' | 'description' | 'imageUrl' | 'releaseYear' | 'platforms' | 'tags'>;
    const games: GameInput[] = [];

    for (const row of dataRows) {
        if (games.length >= MAX_GAMES) break;

        const name     = row[COL.NAME]?.trim() ?? '';
        const imageUrl = row[COL.HEADER_IMAGE]?.trim() ?? '';
        const positive = parseInt(row[COL.POSITIVE] ?? '0', 10) || 0;
        const genres   = row[COL.GENRES]?.trim() ?? '';
        const tags     = row[COL.TAGS]?.trim() ?? '';

        if (!name)                           continue;
        if (!imageUrl.startsWith('http'))    continue;
        if (positive < MIN_POSITIVE_REVIEWS) continue;
        if (/playtest/i.test(name))          continue;
        if (!genres && !tags)                continue;

        const aboutRaw = row[COL.ABOUT]?.trim() ?? '';

        games.push({
            title:       name,
            description: aboutRaw ? truncate(aboutRaw, 1000) : null,
            imageUrl,
            releaseYear: extractYear(row[COL.RELEASE_DATE] ?? ''),
            platforms:   parsePlatforms(
                row[COL.WINDOWS] ?? '',
                row[COL.MAC]     ?? '',
                row[COL.LINUX]   ?? '',
            ),
            tags: parseTags(genres, tags),
        });
    }

    console.log(`✅ ${games.length} jogos selecionados após filtros`);

    if (games.length === 0) {
        // Diagnóstico: mostra os valores encontrados nas primeiras 3 linhas
        console.log('\n🔍 Diagnóstico — primeiras 3 linhas de dados:');
        for (const row of dataRows.slice(0, 3)) {
            console.log({
                name:     row[COL.NAME],
                image:    row[COL.HEADER_IMAGE],
                positive: row[COL.POSITIVE],
                genres:   row[COL.GENRES],
                tags:     row[COL.TAGS],
            });
        }
        process.exit(0);
    }

    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();

    console.log('💾 Inserindo jogos...');
    await Jogo.bulkCreate(games as CreationAttributes<Jogo>[], { ignoreDuplicates: true });

    console.log(`🎮 Seed concluído! ${games.length} jogos inseridos.`);
    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
