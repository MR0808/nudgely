// import { PrismaClient, Support, BadgeColour } from '@prisma/client';
// import GithubSlugger from 'github-slugger';

// const plans = [
//     {
//         name: 'Free',
//         level: 1,
//         maxAdmin: 1,
//         maxUsers: 3,
//         maxTeams: 1,
//         maxNudges: 3,
//         maxRecipients: 1,
//         allTemplates: false,
//         customTemplates: false,
//         nudgeHistory: 60,
//         stats: false,
//         dataExport: false,
//         branding: false,
//         support: Support.COMMUNITYONLY,
//         colour: BadgeColour.destructive
//     },
//     {
//         name: 'Starter',
//         level: 2,
//         maxAdmin: 0,
//         maxUsers: 10,
//         maxTeams: 2,
//         maxNudges: 0,
//         maxRecipients: 5,
//         allTemplates: true,
//         customTemplates: true,
//         nudgeHistory: 365,
//         stats: true,
//         dataExport: false,
//         branding: false,
//         support: Support.EMAILSUPPORT,
//         colour: BadgeColour.default
//     },
//     {
//         name: 'Growth',
//         price: 4900,
//         maxAdmin: 0,
//         maxUsers: 25,
//         maxTeams: 10,
//         maxNudges: 0,
//         maxRecipients: 0,
//         allTemplates: true,
//         customTemplates: true,
//         nudgeHistory: 0,
//         stats: true,
//         dataExport: true,
//         branding: true,
//         support: Support.PRIORITY,
//         colour: BadgeColour.secondary
//     },
//     {
//         name: 'Scale',
//         price: 9900,
//         maxAdmin: 0,
//         maxUsers: 0,
//         maxTeams: 0,
//         maxNudges: 0,
//         maxRecipients: 0,
//         allTemplates: true,
//         customTemplates: true,
//         nudgeHistory: 0,
//         stats: true,
//         dataExport: true,
//         branding: true,
//         support: Support.PRIORITYANDMANAGER,
//         colour: BadgeColour.outline
//     }
// ];

// const prisma = new PrismaClient();

// const slugger = new GithubSlugger();

// async function seedPlans() {
//     const totalLength = plans.length;
//     let count = 1;
//     try {
//         console.log('Seeding plans...');
//         for (const plan of plans) {
//             let slug = slugger.slug(plan.name);
//             await prisma.plan.create({
//                 data: {
//                     slug,
//                     name: plan.name,
//                     maxAdmin: plan.maxAdmin,
//                     maxUsers: plan.maxUsers,
//                     maxTeams: plan.maxTeams,
//                     maxNudges: plan.maxNudges,
//                     maxRecipients: plan.maxRecipients,
//                     allTemplates: plan.allTemplates,
//                     customTemplates: plan.customTemplates,
//                     nudgeHistory: plan.nudgeHistory,
//                     stats: plan.stats,
//                     dataExport: plan.dataExport,
//                     branding: plan.branding,
//                     support: plan.support,
//                     colour: plan.colour
//                 }
//             });
//             console.log(`Seeded ${count} / ${totalLength} Plans`);
//             count++;
//         }
//         console.log(`✅ Seeded ${plans.length} Plans`);
//     } catch (error) {
//         console.error('❌ Error during seeding:', error);
//         throw error;
//     }
// }

// seedPlans()
//     .catch((error) => {
//         console.error('💥 Seed failed:', error);
//         process.exit(1);
//     })
//     .finally(() => prisma.$disconnect());
