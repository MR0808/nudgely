import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Get existing company and plan
    const company = await prisma.company.findFirst({
        where: { slug: 'nudge-co' }
    });

    if (!company) {
        throw new Error(
            'Company not found. Please ensure base data is loaded first.'
        );
    }

    const growthPlan = await prisma.plan.findFirst({
        where: { slug: 'growth' }
    });

    if (!growthPlan) {
        throw new Error('Growth plan not found.');
    }

    console.log('✅ Found existing company and plan');

    // Create additional users
    console.log('👥 Creating additional users...');

    const users = await Promise.all([
        // Company Admin
        prisma.user.upsert({
            where: { email: 'sarah.johnson@nudgeco.com' },
            update: {},
            create: {
                id: 'user-sarah-001',
                name: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah.johnson@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Operations Manager',
                timezone: 'America/New_York',
                locale: 'en-US',
                createdAt: new Date('2025-01-15T10:00:00Z'),
                updatedAt: new Date('2025-01-15T10:00:00Z')
            }
        }),
        // Regular users
        prisma.user.upsert({
            where: { email: 'david.chen@nudgeco.com' },
            update: {},
            create: {
                id: 'user-david-002',
                name: 'David',
                lastName: 'Chen',
                email: 'david.chen@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Product Manager',
                timezone: 'America/Los_Angeles',
                locale: 'en-US',
                createdAt: new Date('2025-01-20T10:00:00Z'),
                updatedAt: new Date('2025-01-20T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'emma.wilson@nudgeco.com' },
            update: {},
            create: {
                id: 'user-emma-003',
                name: 'Emma',
                lastName: 'Wilson',
                email: 'emma.wilson@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Marketing Lead',
                timezone: 'Europe/London',
                locale: 'en-GB',
                createdAt: new Date('2025-02-01T10:00:00Z'),
                updatedAt: new Date('2025-02-01T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'james.brown@nudgeco.com' },
            update: {},
            create: {
                id: 'user-james-004',
                name: 'James',
                lastName: 'Brown',
                email: 'james.brown@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Engineering Lead',
                timezone: 'America/New_York',
                locale: 'en-US',
                createdAt: new Date('2025-02-05T10:00:00Z'),
                updatedAt: new Date('2025-02-05T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'lisa.martinez@nudgeco.com' },
            update: {},
            create: {
                id: 'user-lisa-005',
                name: 'Lisa',
                lastName: 'Martinez',
                email: 'lisa.martinez@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Customer Success Manager',
                timezone: 'America/Chicago',
                locale: 'en-US',
                createdAt: new Date('2025-02-10T10:00:00Z'),
                updatedAt: new Date('2025-02-10T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'alex.kim@nudgeco.com' },
            update: {},
            create: {
                id: 'user-alex-006',
                name: 'Alex',
                lastName: 'Kim',
                email: 'alex.kim@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Sales Representative',
                timezone: 'America/Los_Angeles',
                locale: 'en-US',
                createdAt: new Date('2025-02-15T10:00:00Z'),
                updatedAt: new Date('2025-02-15T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'rachel.taylor@nudgeco.com' },
            update: {},
            create: {
                id: 'user-rachel-007',
                name: 'Rachel',
                lastName: 'Taylor',
                email: 'rachel.taylor@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'HR Manager',
                timezone: 'America/New_York',
                locale: 'en-US',
                createdAt: new Date('2025-02-20T10:00:00Z'),
                updatedAt: new Date('2025-02-20T10:00:00Z')
            }
        }),
        prisma.user.upsert({
            where: { email: 'tom.anderson@nudgeco.com' },
            update: {},
            create: {
                id: 'user-tom-008',
                name: 'Tom',
                lastName: 'Anderson',
                email: 'tom.anderson@nudgeco.com',
                emailVerified: true,
                role: 'USER',
                status: 'ACTIVE',
                jobTitle: 'Software Engineer',
                timezone: 'America/Denver',
                locale: 'en-US',
                createdAt: new Date('2025-02-25T10:00:00Z'),
                updatedAt: new Date('2025-02-25T10:00:00Z')
            }
        })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create company members for new users
    console.log('🏢 Creating company members...');

    await Promise.all([
        // Sarah as Company Admin
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-sarah-001'
                }
            },
            update: {},
            create: {
                id: 'cm-sarah-001',
                companyId: company.id,
                userId: 'user-sarah-001',
                role: 'COMPANY_ADMIN',
                createdAt: new Date('2025-01-15T10:30:00Z'),
                updatedAt: new Date('2025-01-15T10:30:00Z')
            }
        }),
        // Others as Company Members
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-david-002'
                }
            },
            update: {},
            create: {
                id: 'cm-david-002',
                companyId: company.id,
                userId: 'user-david-002',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-01-20T10:30:00Z'),
                updatedAt: new Date('2025-01-20T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-emma-003'
                }
            },
            update: {},
            create: {
                id: 'cm-emma-003',
                companyId: company.id,
                userId: 'user-emma-003',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-01T10:30:00Z'),
                updatedAt: new Date('2025-02-01T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-james-004'
                }
            },
            update: {},
            create: {
                id: 'cm-james-004',
                companyId: company.id,
                userId: 'user-james-004',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-05T10:30:00Z'),
                updatedAt: new Date('2025-02-05T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-lisa-005'
                }
            },
            update: {},
            create: {
                id: 'cm-lisa-005',
                companyId: company.id,
                userId: 'user-lisa-005',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-10T10:30:00Z'),
                updatedAt: new Date('2025-02-10T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-alex-006'
                }
            },
            update: {},
            create: {
                id: 'cm-alex-006',
                companyId: company.id,
                userId: 'user-alex-006',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-15T10:30:00Z'),
                updatedAt: new Date('2025-02-15T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-rachel-007'
                }
            },
            update: {},
            create: {
                id: 'cm-rachel-007',
                companyId: company.id,
                userId: 'user-rachel-007',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-20T10:30:00Z'),
                updatedAt: new Date('2025-02-20T10:30:00Z')
            }
        }),
        prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: company.id,
                    userId: 'user-tom-008'
                }
            },
            update: {},
            create: {
                id: 'cm-tom-008',
                companyId: company.id,
                userId: 'user-tom-008',
                role: 'COMPANY_MEMBER',
                createdAt: new Date('2025-02-25T10:30:00Z'),
                updatedAt: new Date('2025-02-25T10:30:00Z')
            }
        })
    ]);

    console.log('✅ Created company members');

    // Create teams
    console.log('👥 Creating teams...');

    const teams = await Promise.all([
        prisma.team.upsert({
            where: { slug: 'engineering-team' },
            update: {},
            create: {
                id: 'team-eng-001',
                slug: 'engineering-team',
                name: 'Engineering Team',
                description: 'Software development and technical operations',
                companyId: company.id,
                creatorId: 'user-sarah-001',
                status: 'ACTIVE',
                isFrozen: false,
                createdAt: new Date('2025-01-16T10:00:00Z'),
                updatedAt: new Date('2025-01-16T10:00:00Z')
            }
        }),
        prisma.team.upsert({
            where: { slug: 'marketing-team' },
            update: {},
            create: {
                id: 'team-mkt-002',
                slug: 'marketing-team',
                name: 'Marketing Team',
                description: 'Marketing campaigns and brand management',
                companyId: company.id,
                creatorId: 'user-sarah-001',
                status: 'ACTIVE',
                isFrozen: false,
                createdAt: new Date('2025-01-17T10:00:00Z'),
                updatedAt: new Date('2025-01-17T10:00:00Z')
            }
        }),
        prisma.team.upsert({
            where: { slug: 'sales-team' },
            update: {},
            create: {
                id: 'team-sales-003',
                slug: 'sales-team',
                name: 'Sales Team',
                description: 'Sales and business development',
                companyId: company.id,
                creatorId: 'user-sarah-001',
                status: 'ACTIVE',
                isFrozen: false,
                createdAt: new Date('2025-01-18T10:00:00Z'),
                updatedAt: new Date('2025-01-18T10:00:00Z')
            }
        }),
        prisma.team.upsert({
            where: { slug: 'customer-success-team' },
            update: {},
            create: {
                id: 'team-cs-004',
                slug: 'customer-success-team',
                name: 'Customer Success Team',
                description: 'Customer support and success management',
                companyId: company.id,
                creatorId: 'user-sarah-001',
                status: 'ACTIVE',
                isFrozen: false,
                createdAt: new Date('2025-01-19T10:00:00Z'),
                updatedAt: new Date('2025-01-19T10:00:00Z')
            }
        })
    ]);

    console.log(`✅ Created ${teams.length} teams`);

    // Create team members with various roles
    console.log('👤 Creating team members...');

    await Promise.all([
        // Engineering Team
        // James as Team Admin
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-eng-001',
                    userId: 'user-james-004'
                }
            },
            update: {},
            create: {
                id: 'tm-james-eng-001',
                teamId: 'team-eng-001',
                userId: 'user-james-004',
                role: 'TEAM_ADMIN',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-05T11:00:00Z'),
                updatedAt: new Date('2025-02-05T11:00:00Z')
            }
        }),
        // Tom as Team Member
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-eng-001',
                    userId: 'user-tom-008'
                }
            },
            update: {},
            create: {
                id: 'tm-tom-eng-002',
                teamId: 'team-eng-001',
                userId: 'user-tom-008',
                role: 'TEAM_MEMBER',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-25T11:00:00Z'),
                updatedAt: new Date('2025-02-25T11:00:00Z')
            }
        }),
        // David as Team Member
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-eng-001',
                    userId: 'user-david-002'
                }
            },
            update: {},
            create: {
                id: 'tm-david-eng-003',
                teamId: 'team-eng-001',
                userId: 'user-david-002',
                role: 'TEAM_MEMBER',
                status: 'ACTIVE',
                createdAt: new Date('2025-01-20T11:00:00Z'),
                updatedAt: new Date('2025-01-20T11:00:00Z')
            }
        }),

        // Marketing Team
        // Emma as Team Admin
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-mkt-002',
                    userId: 'user-emma-003'
                }
            },
            update: {},
            create: {
                id: 'tm-emma-mkt-001',
                teamId: 'team-mkt-002',
                userId: 'user-emma-003',
                role: 'TEAM_ADMIN',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-01T11:00:00Z'),
                updatedAt: new Date('2025-02-01T11:00:00Z')
            }
        }),
        // Sarah as Team Member (company admin but regular team member)
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-mkt-002',
                    userId: 'user-sarah-001'
                }
            },
            update: {},
            create: {
                id: 'tm-sarah-mkt-002',
                teamId: 'team-mkt-002',
                userId: 'user-sarah-001',
                role: 'TEAM_MEMBER',
                status: 'ACTIVE',
                createdAt: new Date('2025-01-15T11:00:00Z'),
                updatedAt: new Date('2025-01-15T11:00:00Z')
            }
        }),

        // Sales Team
        // Alex as Team Admin
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-sales-003',
                    userId: 'user-alex-006'
                }
            },
            update: {},
            create: {
                id: 'tm-alex-sales-001',
                teamId: 'team-sales-003',
                userId: 'user-alex-006',
                role: 'TEAM_ADMIN',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-15T11:00:00Z'),
                updatedAt: new Date('2025-02-15T11:00:00Z')
            }
        }),

        // Customer Success Team
        // Lisa as Team Admin
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-cs-004',
                    userId: 'user-lisa-005'
                }
            },
            update: {},
            create: {
                id: 'tm-lisa-cs-001',
                teamId: 'team-cs-004',
                userId: 'user-lisa-005',
                role: 'TEAM_ADMIN',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-10T11:00:00Z'),
                updatedAt: new Date('2025-02-10T11:00:00Z')
            }
        }),
        // Rachel as Team Member
        prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: 'team-cs-004',
                    userId: 'user-rachel-007'
                }
            },
            update: {},
            create: {
                id: 'tm-rachel-cs-002',
                teamId: 'team-cs-004',
                userId: 'user-rachel-007',
                role: 'TEAM_MEMBER',
                status: 'ACTIVE',
                createdAt: new Date('2025-02-20T11:00:00Z'),
                updatedAt: new Date('2025-02-20T11:00:00Z')
            }
        })
    ]);

    console.log('✅ Created team members');

    // Create nudges
    console.log('📬 Creating nudges...');

    const nudges = await Promise.all([
        // Daily standup for Engineering Team
        prisma.nudge.upsert({
            where: { slug: 'daily-standup-engineering' },
            update: {},
            create: {
                id: 'nudge-standup-001',
                slug: 'daily-standup-engineering',
                name: 'Daily Standup Update',
                description:
                    'Share what you worked on yesterday and what you plan to work on today',
                status: 'ACTIVE',
                frequency: 'DAILY',
                interval: 1,
                timeOfDay: '09:00',
                timezone: 'America/New_York',
                endType: 'NEVER',
                startDate: new Date('2025-03-01T09:00:00Z'),
                teamId: 'team-eng-001',
                creatorId: 'user-james-004',
                createdAt: new Date('2025-02-28T10:00:00Z'),
                updatedAt: new Date('2025-02-28T10:00:00Z')
            }
        }),
        // Weekly marketing report
        prisma.nudge.upsert({
            where: { slug: 'weekly-marketing-report' },
            update: {},
            create: {
                id: 'nudge-mkt-report-002',
                slug: 'weekly-marketing-report',
                name: 'Weekly Marketing Report',
                description:
                    'Submit your weekly marketing metrics and campaign updates',
                status: 'ACTIVE',
                frequency: 'WEEKLY',
                interval: 1,
                dayOfWeek: 5, // Friday
                timeOfDay: '16:00',
                timezone: 'Europe/London',
                endType: 'NEVER',
                startDate: new Date('2025-03-07T16:00:00Z'),
                teamId: 'team-mkt-002',
                creatorId: 'user-emma-003',
                createdAt: new Date('2025-03-01T10:00:00Z'),
                updatedAt: new Date('2025-03-01T10:00:00Z')
            }
        }),
        // Monthly sales review
        prisma.nudge.upsert({
            where: { slug: 'monthly-sales-review' },
            update: {},
            create: {
                id: 'nudge-sales-review-003',
                slug: 'monthly-sales-review',
                name: 'Monthly Sales Review',
                description:
                    'Review and submit your monthly sales numbers and pipeline updates',
                status: 'ACTIVE',
                frequency: 'MONTHLY',
                interval: 1,
                monthlyType: 'DAY_OF_MONTH',
                dayOfMonth: 1,
                timeOfDay: '10:00',
                timezone: 'America/Los_Angeles',
                endType: 'NEVER',
                startDate: new Date('2025-04-01T10:00:00Z'),
                teamId: 'team-sales-003',
                creatorId: 'user-alex-006',
                createdAt: new Date('2025-03-15T10:00:00Z'),
                updatedAt: new Date('2025-03-15T10:00:00Z')
            }
        }),
        // Customer feedback collection
        prisma.nudge.upsert({
            where: { slug: 'customer-feedback-weekly' },
            update: {},
            create: {
                id: 'nudge-feedback-004',
                slug: 'customer-feedback-weekly',
                name: 'Customer Feedback Collection',
                description:
                    'Collect and summarize customer feedback from the past week',
                status: 'ACTIVE',
                frequency: 'WEEKLY',
                interval: 1,
                dayOfWeek: 1, // Monday
                timeOfDay: '09:00',
                timezone: 'America/Chicago',
                endType: 'AFTER_OCCURRENCES',
                endAfterOccurrences: 12, // 3 months
                startDate: new Date('2025-03-03T09:00:00Z'),
                teamId: 'team-cs-004',
                creatorId: 'user-lisa-005',
                createdAt: new Date('2025-03-01T10:00:00Z'),
                updatedAt: new Date('2025-03-01T10:00:00Z')
            }
        }),
        // Code review reminder
        prisma.nudge.upsert({
            where: { slug: 'code-review-reminder' },
            update: {},
            create: {
                id: 'nudge-code-review-005',
                slug: 'code-review-reminder',
                name: 'Code Review Reminder',
                description:
                    'Review pending pull requests and provide feedback',
                status: 'ACTIVE',
                frequency: 'DAILY',
                interval: 1,
                timeOfDay: '14:00',
                timezone: 'America/New_York',
                endType: 'NEVER',
                startDate: new Date('2025-03-01T14:00:00Z'),
                teamId: 'team-eng-001',
                creatorId: 'user-james-004',
                createdAt: new Date('2025-02-28T10:00:00Z'),
                updatedAt: new Date('2025-02-28T10:00:00Z')
            }
        })
    ]);

    console.log(`✅ Created ${nudges.length} nudges`);

    // Create nudge recipients (mix of users and non-users)
    console.log('📧 Creating nudge recipients...');

    await Promise.all([
        // Daily standup - all engineering team members (users)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-standup-001',
                    email: 'james.brown@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-james-standup-001',
                nudgeId: 'nudge-standup-001',
                userId: 'user-james-004',
                name: 'James Brown',
                email: 'james.brown@nudgeco.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        }),
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-standup-001',
                    email: 'tom.anderson@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-tom-standup-002',
                nudgeId: 'nudge-standup-001',
                userId: 'user-tom-008',
                name: 'Tom Anderson',
                email: 'tom.anderson@nudgeco.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        }),
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-standup-001',
                    email: 'david.chen@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-david-standup-003',
                nudgeId: 'nudge-standup-001',
                userId: 'user-david-002',
                name: 'David Chen',
                email: 'david.chen@nudgeco.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        }),

        // Weekly marketing report - team members + external contractor (non-user)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-mkt-report-002',
                    email: 'emma.wilson@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-emma-mkt-001',
                nudgeId: 'nudge-mkt-report-002',
                userId: 'user-emma-003',
                name: 'Emma Wilson',
                email: 'emma.wilson@nudgeco.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-mkt-report-002',
                    email: 'sarah.johnson@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-sarah-mkt-002',
                nudgeId: 'nudge-mkt-report-002',
                userId: 'user-sarah-001',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@nudgeco.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),
        // External contractor (non-user)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-mkt-report-002',
                    email: 'contractor@marketingagency.com'
                }
            },
            update: {},
            create: {
                id: 'nr-contractor-mkt-003',
                nudgeId: 'nudge-mkt-report-002',
                userId: null,
                name: 'Marketing Contractor',
                email: 'contractor@marketingagency.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),

        // Monthly sales review - sales team + external consultant
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-sales-review-003',
                    email: 'alex.kim@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-alex-sales-001',
                nudgeId: 'nudge-sales-review-003',
                userId: 'user-alex-006',
                name: 'Alex Kim',
                email: 'alex.kim@nudgeco.com',
                createdAt: new Date('2025-03-15T10:30:00Z'),
                updatedAt: new Date('2025-03-15T10:30:00Z')
            }
        }),
        // External sales consultant (non-user)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-sales-review-003',
                    email: 'consultant@salespro.com'
                }
            },
            update: {},
            create: {
                id: 'nr-consultant-sales-002',
                nudgeId: 'nudge-sales-review-003',
                userId: null,
                name: 'Sales Consultant',
                email: 'consultant@salespro.com',
                createdAt: new Date('2025-03-15T10:30:00Z'),
                updatedAt: new Date('2025-03-15T10:30:00Z')
            }
        }),

        // Customer feedback - CS team + external support agent
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-feedback-004',
                    email: 'lisa.martinez@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-lisa-feedback-001',
                nudgeId: 'nudge-feedback-004',
                userId: 'user-lisa-005',
                name: 'Lisa Martinez',
                email: 'lisa.martinez@nudgeco.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-feedback-004',
                    email: 'rachel.taylor@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-rachel-feedback-002',
                nudgeId: 'nudge-feedback-004',
                userId: 'user-rachel-007',
                name: 'Rachel Taylor',
                email: 'rachel.taylor@nudgeco.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),
        // External support agent (non-user)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-feedback-004',
                    email: 'support@outsourcedcs.com'
                }
            },
            update: {},
            create: {
                id: 'nr-support-feedback-003',
                nudgeId: 'nudge-feedback-004',
                userId: null,
                name: 'External Support Agent',
                email: 'support@outsourcedcs.com',
                createdAt: new Date('2025-03-01T10:30:00Z'),
                updatedAt: new Date('2025-03-01T10:30:00Z')
            }
        }),

        // Code review reminder - engineering team + external code reviewer
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-code-review-005',
                    email: 'james.brown@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-james-review-001',
                nudgeId: 'nudge-code-review-005',
                userId: 'user-james-004',
                name: 'James Brown',
                email: 'james.brown@nudgeco.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        }),
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-code-review-005',
                    email: 'tom.anderson@nudgeco.com'
                }
            },
            update: {},
            create: {
                id: 'nr-tom-review-002',
                nudgeId: 'nudge-code-review-005',
                userId: 'user-tom-008',
                name: 'Tom Anderson',
                email: 'tom.anderson@nudgeco.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        }),
        // External code reviewer (non-user)
        prisma.nudgeRecipient.upsert({
            where: {
                nudgeId_email: {
                    nudgeId: 'nudge-code-review-005',
                    email: 'reviewer@codeaudit.com'
                }
            },
            update: {},
            create: {
                id: 'nr-reviewer-review-003',
                nudgeId: 'nudge-code-review-005',
                userId: null,
                name: 'External Code Reviewer',
                email: 'reviewer@codeaudit.com',
                createdAt: new Date('2025-02-28T10:30:00Z'),
                updatedAt: new Date('2025-02-28T10:30:00Z')
            }
        })
    ]);

    console.log('✅ Created nudge recipients');

    // Create some nudge instances for testing
    console.log('📅 Creating nudge instances...');

    await Promise.all([
        // Recent instance for daily standup
        prisma.nudgeInstance.upsert({
            where: { id: 'ni-standup-001' },
            update: {},
            create: {
                id: 'ni-standup-001',
                nudgeId: 'nudge-standup-001',
                scheduledFor: new Date('2025-03-15T09:00:00Z'),
                status: 'COMPLETED',
                completedAt: new Date('2025-03-15T09:45:00Z'),
                createdAt: new Date('2025-03-15T06:00:00Z'),
                updatedAt: new Date('2025-03-15T09:45:00Z')
            }
        }),
        // Pending instance for today
        prisma.nudgeInstance.upsert({
            where: { id: 'ni-standup-002' },
            update: {},
            create: {
                id: 'ni-standup-002',
                nudgeId: 'nudge-standup-001',
                scheduledFor: new Date('2025-03-16T09:00:00Z'),
                status: 'PENDING',
                createdAt: new Date('2025-03-16T06:00:00Z'),
                updatedAt: new Date('2025-03-16T06:00:00Z')
            }
        }),
        // Overdue instance
        prisma.nudgeInstance.upsert({
            where: { id: 'ni-feedback-001' },
            update: {},
            create: {
                id: 'ni-feedback-001',
                nudgeId: 'nudge-feedback-004',
                scheduledFor: new Date('2025-03-10T09:00:00Z'),
                status: 'OVERDUE',
                overdueCount: 2,
                createdAt: new Date('2025-03-10T06:00:00Z'),
                updatedAt: new Date('2025-03-12T09:00:00Z')
            }
        })
    ]);

    console.log('✅ Created nudge instances');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
