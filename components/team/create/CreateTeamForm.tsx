'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Users } from 'lucide-react';

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
import { createTeam } from '@/actions/team';
import { CreateTeamFormProps } from '@/types/team';
import { TeamSchema } from '@/schemas/team';
import { logTeamCreated } from '@/actions/audit/audit-team';
import { useTeamStore } from '@/stores/teamStore';

const CreateTeamForm = ({ companyId, userSession }: CreateTeamFormProps) => {
    const { setIsReloadTeam, setSelectedTeam } = useTeamStore();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof TeamSchema>>({
        resolver: zodResolver(TeamSchema),
        defaultValues: {
            name: '',
            description: ''
        }
    });

    const onSubmit = (values: z.infer<typeof TeamSchema>) => {
        startTransition(async () => {
            const data = await createTeam(values, companyId);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                if (userSession) {
                    await logTeamCreated(userSession.user.id, {
                        teamId: data.data.team.id,
                        teamName: data.data.team.name
                    });
                }
                const team = {
                    id: data.data.teamMember.id,
                    name: data.data.teamMember.team.name,
                    role: data.data.teamMember.role,
                    memberCount: data.data.teamMember.team.members.length,
                    tasksCount: data.data.teamMember.team.nudges.length
                };
                setIsReloadTeam(true);
                setSelectedTeam(team);
                toast.success('Team successfully created');
                router.push(`/`);
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Team Name</FormLabel>
                                <FormControl>
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <p className="text-sm text-muted-foreground">
                        Choose a clear, descriptive name for your team.
                    </p>
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
                                        className="w-full resize-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <p className="text-sm text-muted-foreground">
                        Optional: Help team members understand the team&apos;s
                        purpose and goals.
                    </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>You&apos;ll be added as the team admin</span>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="cursor-pointer"
                        >
                            {isPending ? (
                                <>
                                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Please wait...
                                </>
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default CreateTeamForm;
