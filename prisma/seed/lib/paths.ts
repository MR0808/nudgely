import { join } from 'node:path';

export function seedDataPath(fileName: string) {
    return join(process.cwd(), 'prisma', 'seed', 'data', fileName);
}
