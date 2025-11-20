import type { Metadata } from 'next';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import type { ParamsSlug } from '@/types/global';
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
    if (!nudge.success) {
        return { title: 'Nudge not found' };
    }
    const title = `Nudge - ${nudge.data.nudge.name}`;
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

    const res = await getNudgeBySlug(slug);
    const formatDate = (date: Date, timeZone: string) => {
        return formatInTimeZone(date, timeZone, 'hh:mm a dd/MM/yyyy');
    };

    if (!res.success) {
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

    const { nudge } = res.data;

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
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-semibold text-sm">
                                        Created At
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-sm">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-sm">
                                        Completed At
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-sm">
                                        Completed By
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {nudge.instances.map((instance) => (
                                    <tr
                                        key={instance.id}
                                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-sm">
                                            {formatDate(
                                                instance.createdAt,
                                                nudge.timezone
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge
                                                variant={
                                                    instance.status ===
                                                    'COMPLETED'
                                                        ? 'default'
                                                        : instance.status ===
                                                            'FAILED'
                                                          ? 'destructive'
                                                          : 'secondary'
                                                }
                                                className={
                                                    instance.status ===
                                                    'COMPLETED'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : ''
                                                }
                                            >
                                                {instance.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {instance.completion?.createdAt
                                                ? formatDate(
                                                      instance.completion
                                                          .createdAt,
                                                      nudge.timezone
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {instance.completion
                                                ?.completedByName || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {nudge.instances.map((instance) => (
                            <div
                                key={instance.id}
                                className="border rounded-lg p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Created At
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatDate(
                                                instance.createdAt,
                                                nudge.timezone
                                            )}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            instance.status === 'COMPLETED'
                                                ? 'default'
                                                : instance.status === 'FAILED'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                        className={
                                            instance.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : ''
                                        }
                                    >
                                        {instance.status}
                                    </Badge>
                                </div>
                                {instance.completion && (
                                    <>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Completed At
                                                </p>
                                                <p className="text-sm">
                                                    {instance.completion
                                                        ?.createdAt
                                                        ? formatDate(
                                                              instance
                                                                  .completion
                                                                  .createdAt,
                                                              nudge.timezone
                                                          )
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Completed By
                                                </p>
                                                <p className="text-sm">
                                                    {instance.completion
                                                        ?.completedByName ||
                                                        '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </>
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
