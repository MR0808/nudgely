// import { createClient } from '@supabase/supabase-js';

// import { prisma } from '@/lib/prisma';

// const supabaseUrl = process.env.SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_KEY!;

// // Server-side client with service role key for admin operations
// export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
//     auth: {
//         autoRefreshToken: false,
//         persistSession: false
//     }
// });

// export interface CleanupResult {
//     deletedCount: number;
//     totalFound: number;
//     errors: string[];
// }

// export interface CleanupOptions {
//     dryRun?: boolean;
//     olderThanDays?: number;
// }

// export async function cleanupOrphanedImages(
//     options: CleanupOptions = {}
// ): Promise<CleanupResult> {
//     const { dryRun = false, olderThanDays } = options;

//     try {
//         console.log(`Starting image cleanup (dry run: ${dryRun})...`);

//         // Build the where clause
//         const whereClause: any = {
//             OR: [{ relatedEntity: null }, { relatedEntity: '' }]
//         };

//         // Optionally filter by age
//         if (olderThanDays) {
//             const cutoffDate = new Date();
//             cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
//             whereClause.createdAt = {
//                 lt: cutoffDate
//             };
//         }

//         // Find all orphaned images
//         const orphanedImages = await prisma.image.findMany({
//             where: whereClause,
//             select: {
//                 id: true,
//                 imageName: true,
//                 bucket: true,
//                 createdAt: true
//             }
//         });

//         console.log(`Found ${orphanedImages.length} orphaned images`);

//         if (orphanedImages.length === 0 || dryRun) {
//             return {
//                 deletedCount: 0,
//                 totalFound: orphanedImages.length,
//                 errors: []
//             };
//         }

//         let deletedCount = 0;
//         const errors: string[] = [];

//         // Process each orphaned image
//         for (const image of orphanedImages) {
//             try {
//                 // Delete from Supabase storage
//                 const { error: storageError } = await supabaseServer.storage
//                     .from(image.bucket)
//                     .remove([image.imageName]);

//                 if (storageError) {
//                     console.error(
//                         `Failed to delete ${image.imageName} from storage:`,
//                         storageError
//                     );
//                     errors.push(
//                         `Storage deletion failed for ${image.imageName}: ${storageError.message}`
//                     );
//                     continue;
//                 }

//                 // Delete from database
//                 await prisma.image.delete({
//                     where: { id: image.id }
//                 });

//                 deletedCount++;
//                 console.log(`Successfully deleted image: ${image.imageName}`);
//             } catch (error) {
//                 console.error(
//                     `Error processing image ${image.imageName}:`,
//                     error
//                 );
//                 errors.push(
//                     `Processing failed for ${image.imageName}: ${
//                         error instanceof Error ? error.message : 'Unknown error'
//                     }`
//                 );
//             }
//         }

//         console.log(
//             `Image cleanup completed. Deleted: ${deletedCount}, Errors: ${errors.length}`
//         );

//         return {
//             deletedCount,
//             totalFound: orphanedImages.length,
//             errors
//         };
//     } finally {
//         await prisma.$disconnect();
//     }
// }
