import { createClient } from '@supabase/supabase-js';

import { prisma } from '@/lib/prisma';

const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
    process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export interface CleanupResult {
    deletedCount: number;
    totalFound: number;
    errors: string[];
}

export interface CleanupOptions {
    dryRun?: boolean;
    olderThanDays?: number;
}

export async function cleanupOrphanedImages(
    options: CleanupOptions = {}
): Promise<CleanupResult> {
    const { dryRun = false, olderThanDays } = options;

    try {
        const whereClause: {
            OR: Array<{ relatedEntity: null } | { relatedEntity: string }>;
            createdAt?: { lt: Date };
        } = {
            OR: [{ relatedEntity: null }, { relatedEntity: '' }]
        };

        if (olderThanDays) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            whereClause.createdAt = {
                lt: cutoffDate
            };
        }

        const orphanedImages = await prisma.image.findMany({
            where: whereClause,
            select: {
                id: true,
                imageName: true,
                bucket: true,
                createdAt: true
            }
        });

        if (orphanedImages.length === 0 || dryRun) {
            return {
                deletedCount: 0,
                totalFound: orphanedImages.length,
                errors: []
            };
        }

        let deletedCount = 0;
        const errors: string[] = [];

        for (const image of orphanedImages) {
            try {
                const { error: storageError } = await supabaseServer.storage
                    .from(image.bucket)
                    .remove([image.imageName]);

                if (storageError) {
                    console.error(
                        `Failed to delete ${image.imageName} from storage:`,
                        storageError
                    );
                    errors.push(
                        `Storage deletion failed for ${image.imageName}: ${storageError.message}`
                    );
                    continue;
                }

                await prisma.image.delete({
                    where: { id: image.id }
                });

                deletedCount++;
            } catch (error) {
                console.error(
                    `Error processing image ${image.imageName}:`,
                    error
                );
                errors.push(
                    `Processing failed for ${image.imageName}: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`
                );
            }
        }

        return {
            deletedCount,
            totalFound: orphanedImages.length,
            errors
        };
    } finally {
        await prisma.$disconnect();
    }
}
