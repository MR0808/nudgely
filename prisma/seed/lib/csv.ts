import { readFileSync } from 'node:fs';

export function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

export function readCsv(filePath: string): Record<string, string>[] {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return [];
    }

    const headers = parseCsvLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
        });

        return row;
    });
}

export function parseBool(value: string): boolean {
    return value === 'true' || value === '1';
}

export function parseOptionalInt(value: string): number | null {
    if (!value?.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseOptionalDate(value: string): Date | null {
    if (!value?.trim()) return null;
    return new Date(value);
}

export function parseRequiredDate(value: string): Date {
    return new Date(value);
}
