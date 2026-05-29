import fs from 'node:fs';

export const MIN_TOTAL_REVIEWS = 200;
export const MIN_POSITIVE_RATIO = 0.70;

export const ADULT_CONTENT_LABELS = new Set([
    'nsfw',
    'nudity',
    'sexual content',
    'adult only sexual content',
    'adult only',
    'hentai',
    'erotic',
    'lewd',
    'pornographic',
    'xxx',
    'sex',
    'pin-up',
]);

export const ADULT_CONTENT_PATTERN =
    /\b(nsfw|hentai|pornograph|xxx|erotic|nudity|lewd|adult[\s-]only|sexual[\s-]content)\b/i;

export type GameCsvColumns = {
    NAME: number;
    RELEASE_DATE: number;
    ABOUT: number;
    HEADER_IMAGE: number;
    WINDOWS: number;
    MAC: number;
    LINUX: number;
    POSITIVE: number;
    NEGATIVE: number;
    GENRES: number;
    TAGS: number;
    CATEGORIES: number;
};

export function buildColumnMap(header: string[]): GameCsvColumns {
    const col = (name: string): number => {
        const idx = header.indexOf(name);
        if (idx === -1) throw new Error(`Coluna não encontrada: "${name}"`);
        return idx;
    };
    const shifted = (name: string) => col(name) + 1;

    return {
        NAME: col('Name'),
        RELEASE_DATE: col('Release date'),
        ABOUT: shifted('About the game'),
        HEADER_IMAGE: shifted('Header image'),
        WINDOWS: shifted('Windows'),
        MAC: shifted('Mac'),
        LINUX: shifted('Linux'),
        POSITIVE: shifted('Positive'),
        NEGATIVE: shifted('Negative'),
        GENRES: shifted('Genres'),
        TAGS: shifted('Tags'),
        CATEGORIES: shifted('Categories'),
    };
}

export function extractYear(dateStr: string): number | null {
    const match = dateStr.match(/\d{4}/);
    return match ? Number.parseInt(match[0], 10) : null;
}

export function parsePlatforms(win: string, mac: string, linux: string): string[] {
    const platforms: string[] = [];
    if (win.trim().toLowerCase() === 'true') platforms.push('Windows');
    if (mac.trim().toLowerCase() === 'true') platforms.push('macOS');
    if (linux.trim().toLowerCase() === 'true') platforms.push('Linux');
    return platforms;
}

export function parseTags(genres: string, tags: string): string[] {
    const seen = new Set<string>();
    for (const raw of [...genres.split(','), ...tags.split(',')]) {
        const t = raw.trim();
        if (t) seen.add(t);
    }
    return [...seen].slice(0, 10);
}

export function truncate(str: string, max: number): string {
    return str.length <= max ? str : str.slice(0, max).trimEnd() + '…';
}

function splitLabels(value: string): string[] {
    return value
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);
}

export function passesReviewFilter(positive: number, negative: number): boolean {
    const total = positive + negative;
    if (total < MIN_TOTAL_REVIEWS) return false;
    return positive / total >= MIN_POSITIVE_RATIO;
}

export function isAdultContent(input: {
    title: string;
    genres: string;
    tags: string;
    categories: string;
}): boolean {
    const labels = [
        ...splitLabels(input.genres),
        ...splitLabels(input.tags),
        ...splitLabels(input.categories),
    ];

    if (labels.some((label) => ADULT_CONTENT_LABELS.has(label))) {
        return true;
    }

    const metadata = `${input.title} ${input.genres} ${input.tags} ${input.categories}`;
    return ADULT_CONTENT_PATTERN.test(metadata);
}

export function passesSeedFilters(row: string[], col: GameCsvColumns): boolean {
    const name = row[col.NAME]?.trim() ?? '';
    const imageUrl = row[col.HEADER_IMAGE]?.trim() ?? '';
    const positive = Number.parseInt(row[col.POSITIVE] ?? '0', 10) || 0;
    const negative = Number.parseInt(row[col.NEGATIVE] ?? '0', 10) || 0;
    const genres = row[col.GENRES]?.trim() ?? '';
    const tags = row[col.TAGS]?.trim() ?? '';
    const categories = row[col.CATEGORIES]?.trim() ?? '';

    if (!name) return false;
    if (!imageUrl.startsWith('http')) return false;
    if (!passesReviewFilter(positive, negative)) return false;
    if (/playtest/i.test(name)) return false;
    if (!genres && !tags) return false;
    if (isAdultContent({ title: name, genres, tags, categories })) return false;

    return true;
}

export function rowToCsv(row: string[]): string {
    return row
        .map((field) => {
            if (/[",\n\r]/.test(field)) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        })
        .join(',');
}

export async function* readCsvRows(filePath: string): AsyncGenerator<string[]> {
    const stream = fs.createReadStream(filePath, {
        encoding: 'utf-8',
        highWaterMark: 4 * 1024 * 1024,
    });

    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for await (const chunk of stream) {
        for (let i = 0; i < chunk.length; i++) {
            const ch = chunk[i]!;

            if (ch === '"') {
                if (inQuotes && chunk[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                row.push(field);
                field = '';
            } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
                if (ch === '\r' && chunk[i + 1] === '\n') i++;
                row.push(field);
                yield row;
                row = [];
                field = '';
            } else {
                field += ch;
            }
        }
    }

    if (row.length > 0 || field) {
        row.push(field);
        yield row;
    }
}

export function rowToGameInput(
    row: string[],
    col: GameCsvColumns,
) {
    const genres = row[col.GENRES]?.trim() ?? '';
    const tags = row[col.TAGS]?.trim() ?? '';
    const aboutRaw = row[col.ABOUT]?.trim() ?? '';

    return {
        title: row[col.NAME]?.trim() ?? '',
        description: aboutRaw ? truncate(aboutRaw, 1000) : null,
        imageUrl: row[col.HEADER_IMAGE]?.trim() ?? '',
        releaseYear: extractYear(row[col.RELEASE_DATE] ?? ''),
        platforms: parsePlatforms(
            row[col.WINDOWS] ?? '',
            row[col.MAC] ?? '',
            row[col.LINUX] ?? '',
        ),
        tags: parseTags(genres, tags),
    };
}
