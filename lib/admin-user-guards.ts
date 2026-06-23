import { prisma } from '@/lib/prisma';

export async function assertAdminCanModifyUser(
    adminUserId: string,
    targetUserId: string
) {
    if (adminUserId === targetUserId) {
        throw new Error('You cannot modify your own account');
    }

    const target = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true }
    });

    if (!target) {
        throw new Error('User not found');
    }

    if (target.role === 'SITE_ADMIN') {
        throw new Error('You cannot modify another site admin');
    }
}
