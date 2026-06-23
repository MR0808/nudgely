'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Company } from '@/types/company';

export function CompanyDataExportCard({ company }: { company: Company }) {
    if (!company.plan.dataExport) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data export
                </CardTitle>
                <CardDescription>
                    Download your company nudges, teams, and member list as
                    JSON (full export) or CSV (nudge summary rows only).
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                    <Link href="/api/company/export?format=json" download>
                        Export JSON
                    </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link href="/api/company/export?format=csv" download>
                        Export CSV (nudges)
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
