import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Users,
    ArrowLeft,
    Crown,
    Calendar,
    Building2,
    CheckSquare,
    UserPlus,
    MoreHorizontal,
    Trash2
} from 'lucide-react';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCurrentTeamBySlug } from '@/actions/team';
import { ParamsSlug } from '@/types/global';
import { Button } from '@/components/ui/button';
import TeamEditForm from '@/components/team/view/TeamEditForm';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const team = await getCurrentTeamBySlug(slug);
    if (!team) {
        return { title: 'Team not found' };
    }
    const title = `${team.team.name} | Members`;
    const description = 'Team members edit';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/team/${slug}/members`,
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
