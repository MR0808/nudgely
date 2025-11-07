import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { authCheck } from '@/lib/authCheck';
import { getUserTeams } from '@/actions/team';
import { getPlan } from '@/actions/plan';
import TemplateManagement from '@/components/templates/TemplateManagement';
import siteMetadata from '@/utils/siteMetaData';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Template Management`;
    const description = 'Manage your team templates';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/templates`,
            siteName: siteMetadata.title,
            locale: 'en_AU',
            type: 'article',
            publishedTime: '2024-08-15 13:00:00',
            modifiedTime: '2024-08-15 13:00:00',
            images,
            authors: [siteMetadata.author]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images
        }
    };
}

export default async function TemplatesPage() {
    const userSession = await authCheck('/templates');
    const teams = await getUserTeams();
    const plan = await getPlan();

    if (!plan.plan) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Company data not found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The teams you&apos;re looking for doesn&apos;t exist
                            or you don&apos;t have access to it.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                <TemplateManagement teams={teams || []} plan={plan.plan} />
            </div>
        </div>
    );
}
