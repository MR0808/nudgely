'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Settings, Save, Loader2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TeamSchema } from '@/schemas/team';
import { TeamEditFormProps } from '@/types/team';
import { cn } from '@/lib/utils';
import { updateTeam } from '@/actions/team';
import { logTeamUpdated } from '@/actions/audit/audit-team';

const TeamEditForm = ({ team, companyId, userSession }: TeamEditFormProps) => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof TeamSchema>>({
        resolver: zodResolver(TeamSchema),
        defaultValues: {
            name: team.name,
            description: team.description
        }
    });

    const onSubmit = (values: z.infer<typeof TeamSchema>) => {
        startTransition(async () => {
            const data = await updateTeam(values, team.id, companyId);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                if (userSession) {
                    await logTeamUpdated(userSession.user.id, {
                        teamId: data.data.id,
                        originalTeamName: team.name,
                        newteamName: data.data.name,
                        originalTeamDescription: team.description,
                        newteamDescription: data.data.description
                    });
                }
                toast.success('Team successfully updated');
                if (team.name !== values.name) {
                    router.push(`/team/${data.data.slug}`);
                }
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Settings
                </CardTitle>
                <CardDescription>
                    Update your team information and settings
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Team Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="w-full bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-sm text-destructive" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className={cn(
                                                    'w-full resize-none bg-white'
                                                )}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-sm text-destructive" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={false}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
export default TeamEditForm;
