import 'dotenv/config';
import { createDirectPrismaClient } from '../lib/create-prisma-client';

const email = process.argv[2] || 'kram@grebnesor.com';

async function main() {
    const prisma = createDirectPrismaClient();
    const user = await prisma.user.findFirst({
        where: { email },
        include: {
            companyMember: {
                include: {
                    company: {
                        include: {
                            plan: true,
                            companySubscription: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        process.exit(1);
    }

    console.log(JSON.stringify(user, null, 2));

    const events = await prisma.processedStripeEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('\nRecent processed Stripe events:');
    console.log(events);

    await prisma.$disconnect();
}

main();
