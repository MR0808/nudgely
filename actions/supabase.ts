'use server';

import { ImageType } from '@/generated/prisma';

import { supabaseServer } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { cleanupOrphanedImages } from '@/lib/supabase';

export const uploadAvatar = async (formData: FormData) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            publicUrl: null,
            error: 'Not authorised'
        };
    }

    try {
        const image = formData.get('image') as File;
        const bucket = formData.get('bucket') as string;

        if (!image || !bucket) {
            return {
                success: false,
                publicUrl: null,
                error: 'Invalid input: image and bucket are required'
            };
        }

        // Validate file type
        if (!image.type.startsWith('image/')) {
            return {
                success: false,
                publicUrl: null,
                error: 'File must be an image'
            };
        }

        // Validate file size (e.g., 5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
            return {
                success: false,
                publicUrl: null,
                error: 'File size must be less than 5MB'
            };
        }

        const timestamp = Date.now();
        const fileExtension = image.name.split('.').pop();
        const newName = `${timestamp}-${crypto.randomUUID()}.${fileExtension}`;

        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(newName, image, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            return {
                success: false,
                publicUrl: null,
                error: `Image upload failed - ${error}`
            };
        }

        const {
            data: { publicUrl }
        } = supabaseServer.storage.from(bucket).getPublicUrl(newName);

        return {
            success: true,
            publicUrl,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            publicUrl: null,
            error: `Server error occurred - ${error}`
        };
    }
};

export const deleteAvatar = async ({
    imageUrl,
    bucket
}: {
    imageUrl: string;
    bucket: string;
}) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }
    try {
        if (!imageUrl || !bucket) {
            return {
                success: false,
                error: 'Invalid input'
            };
        }

        // Extract image name from the URL
        const imageName = imageUrl.split('/').pop();
        if (!imageName) {
            return {
                success: false,
                error: 'Image not found'
            };
        }

        const { error } = await supabaseServer.storage
            .from(bucket)
            .remove([imageName]);

        if (error) {
            return {
                success: false,
                error: 'Image deletion failed'
            };
        }

        return {
            success: true,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: 'Server error'
        };
    }
};

export const uploadImage = async (formData: FormData) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            publicUrl: null,
            fileName: null,
            imageId: null,
            error: 'Not authorised'
        };
    }

    try {
        const image = formData.get('image') as File;
        const bucket = formData.get('bucket') as string;
        const imageType = formData.get('type') as ImageType;

        if (!image || !bucket || !imageType) {
            return {
                success: false,
                publicUrl: null,
                fileName: null,
                imageId: null,
                error: 'Invalid input: image, bucket and type are required'
            };
        }

        // Validate file type
        if (!image.type.startsWith('image/')) {
            return {
                success: false,
                publicUrl: null,
                fileName: null,
                imageId: null,
                error: 'File must be an image'
            };
        }

        // Validate file size (e.g., 5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
            return {
                success: false,
                publicUrl: null,
                fileName: null,
                imageId: null,
                error: 'File size must be less than 5MB'
            };
        }

        const timestamp = Date.now();
        const fileExtension = image.name.split('.').pop();
        const newName = `${timestamp}-${crypto.randomUUID()}.${fileExtension}`;

        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(newName, image, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            return {
                success: false,
                publicUrl: null,
                fileName: null,
                imageId: null,
                error: `Image upload failed - ${error}`
            };
        }

        const {
            data: { publicUrl }
        } = supabaseServer.storage.from(bucket).getPublicUrl(newName);

        const imageData = await prisma.image.create({
            data: { image: publicUrl, imageName: newName, imageType, bucket }
        });

        return {
            success: true,
            publicUrl,
            fileName: newName,
            imageId: imageData.id,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            publicUrl: null,
            fileName: null,
            imageId: null,
            error: `Server error occurred - ${error}`
        };
    }
};

export const deleteImage = async (
    imageUrl: string,
    bucket: string,
    imageId: string
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            error: 'Not authorised'
        };
    }

    try {
        if (!imageUrl || !bucket) {
            return {
                success: false,
                error: 'Invalid input: imageUrl and bucket are required'
            };
        }

        // Extract image name from the URL
        const imageName = imageUrl.split('/').pop();
        if (!imageName) {
            return { success: false, error: 'Invalid image URL' };
        }

        const { error } = await supabaseServer.storage
            .from(bucket)
            .remove([imageName]);

        if (error) {
            return {
                success: false,
                error: `Image deletion failed - ${error}`
            };
        }

        await prisma.image.delete({ where: { id: imageId } });

        return { success: true };
    } catch (error) {
        return { success: false, error: `Server error occurred - ${error}` };
    }
};

// Alternative action that accepts form data for delete
export const deleteImageForm = async (formData: FormData) => {
    const imageUrl = formData.get('imageUrl') as string;
    const bucket = formData.get('bucket') as string;
    const imageId = formData.get('imageId') as string;

    return deleteImage(imageUrl, bucket, imageId);
};

export const manualImageCleanup = async ({
    dryRun,
    olderThanDays
}: {
    dryRun: boolean;
    olderThanDays: number | undefined;
}) => {
    try {
        const result = await cleanupOrphanedImages({
            dryRun,
            olderThanDays
        });

        return {
            success: true,
            message: dryRun
                ? `Dry run: Found ${result.totalFound} orphaned images`
                : `Cleanup completed: ${result.deletedCount}/${result.totalFound} images deleted`,
            result
        };
    } catch (error) {
        console.error('Manual cleanup failed:', error);
        return {
            success: false,
            message: 'Cleanup failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
