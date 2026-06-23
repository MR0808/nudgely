import { stringify } from 'csv-stringify/sync';

import { authCheckServerWithCompany } from '@/lib/authCheck';
import { buildCompanyExportData } from '@/lib/company-export';
import { logAuditEvent } from '@/actions/audit/audit';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await authCheckServerWithCompany();
    if (!session || session.userCompany.role !== 'COMPANY_ADMIN') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const plan = await prisma.plan.findUnique({
        where: { id: session.company.planId },
        select: { dataExport: true, name: true }
    });

    if (!plan?.dataExport) {
        return new Response(
            JSON.stringify({
                error: `Data export is not included on the ${plan?.name ?? 'current'} plan.`
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') ?? 'json';

    const data = await buildCompanyExportData(session.company.id);
    if (!data) {
        return new Response(JSON.stringify({ error: 'Company not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const filenameBase = `nudgely-export-${session.company.slug ?? session.company.id}`;

    await logAuditEvent({
        userId: session.user.id,
        action: 'data.exported',
        category: 'data',
        description: `Exported company data as ${format}`,
        metadata: {
            companyId: session.company.id,
            format
        }
    });

    if (format === 'csv') {
        const rows: (string | number)[][] = [
            [
                'Team',
                'Nudge',
                'Status',
                'Frequency',
                'Interval',
                'Time',
                'Timezone',
                'Recipients',
                'Instances',
                'Completions'
            ]
        ];

        for (const team of data.teams) {
            for (const nudge of team.nudges) {
                rows.push([
                    team.name,
                    nudge.name,
                    nudge.status,
                    nudge.frequency,
                    nudge.interval,
                    nudge.timeOfDay,
                    nudge.timezone,
                    nudge.recipientCount,
                    nudge.instanceCount,
                    nudge.completionCount
                ]);
            }
        }

        const csvString = stringify(rows, { header: false });

        return new Response(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filenameBase}.csv"`
            }
        });
    }

    return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filenameBase}.json"`
        }
    });
}
