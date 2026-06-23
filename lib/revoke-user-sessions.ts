import { prisma } from '@/lib/prisma';

export async function revokeUserSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
}

export async function revokeCompanyMemberSessions(companyId: string) {
    const members = await prisma.companyMember.findMany({
        where: { companyId },
        select: { userId: true }
    });

    const userIds = members.map((member) => member.userId);
    if (userIds.length === 0) return;

    await prisma.session.deleteMany({
        where: { userId: { in: userIds } }
    });
}
