import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { ParamsSlug } from '@/types/global';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getNudgeBySlug } from '@/actions/nudges';
import { Button } from '@/components/ui/button';
import NudgeDropdown from '@/components/nudges/view/NudgeDropdown';

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const nudge = await getNudgeBySlug(slug);
    if (!nudge) {
        return { title: 'Nudge not found' };
    }
    const title = `${nudge.name}`;
    const description = 'Nudge view';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/nudges/${slug}`,
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

const NudgeDetailPage = async (props: { params: Promise<ParamsSlug> }) => {
    const { slug } = await props.params;
    const userSession = await authCheck(`/nudges/${slug}`);

    const nudge = await getNudgeBySlug(slug);

    if (!nudge) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Nudge Not Found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The Nudge you&apos;re looking for doesn&apos;t exist
                            or you don&apos;t have access to it.
                        </p>
                        <Link href="/nudges">
                            <Button>Back to Nudges</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold">{nudge.name}</h1>
                    <h2 className="text-xl font-semibold">{nudge.team.name}</h2>
                </div>
                <NudgeDropdown
                    status={nudge.status}
                    name={nudge.name}
                    nudgeId={nudge.id}
                    slug={nudge.slug}
                />
            </div>

            {/* Nudge Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-gray-700">{nudge.description}</p>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Frequency:</span>{' '}
                            {nudge.frequency}
                        </div>
                        <div>
                            <span className="font-medium">Time:</span>{' '}
                            {nudge.timeOfDay} ({nudge.timezone})
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">Recipients:</span>
                            <div>
                                {nudge.recipients.map((recipient, index) => (
                                    <div
                                        key={index}
                                    >{`${recipient.name} - ${recipient.email}`}</div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>{' '}
                            <span
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                    nudge.status == 'ACTIVE'
                                        ? 'bg-green-100 text-green-700'
                                        : nudge.status === 'PAUSED'
                                          ? 'bg-gray-200 text-gray-600'
                                          : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {nudge.status === 'ACTIVE'
                                    ? 'Active'
                                    : nudge.status === 'PAUSED'
                                      ? 'Paused'
                                      : 'Finished'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {nudge.instances.map((instance) => (
                            <div
                                key={instance.id}
                                className="flex justify-between items-center border-b py-2 text-sm"
                            >
                                <span>{instance.createdAt.toISOString()}</span>
                                <span
                                    className={`font-medium ${
                                        instance.status === 'COMPLETED'
                                            ? 'text-green-600'
                                            : instance.status === 'FAILED'
                                              ? 'text-red-600'
                                              : 'text-gray-600'
                                    }`}
                                >
                                    {instance.status}
                                </span>
                                {instance.completion && (
                                    <span className="text-gray-500 text-xs">
                                        by {instance.completion.completedBy}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NudgeDetailPage;
