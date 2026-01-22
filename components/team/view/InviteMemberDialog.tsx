'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { UserPlus, Loader2, Crown, Users } from 'lucide-react';
import { TeamRole } from '@/lib/prisma-enums';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InviteMemberDialogProps } from '@/types/team';
import { inviteTeamMember } from '@/actions/teamMember';
import { InviteTeamMemberSchema } from '@/schemas/teamMember';

export function InviteMemberDialog({
    teamId,
    teamName,
    companyPlan,
    currentMemberCount,
    setMembers,
    setPendingInvites,
    trigger
}: InviteMemberDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof InviteTeamMemberSchema>>({
        resolver: zodResolver(InviteTeamMemberSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'TEAM_MEMBER'
        }
    });

    const onSubmit = (values: z.infer<typeof InviteTeamMemberSchema>) => {
        setError(null);
        startTransition(async () => {
            const data = await inviteTeamMember(values, teamId);
            if (data.error) {
                setError(data.error || 'Failed to send invitation');
                toast.error(data.error);
            }
            if (data.success) {
                if (data.method === 'added') {
                    if (data.members) setMembers(data.members);
                    toast.success('User successfully added');
                }
                if (data.method === 'invited' && setPendingInvites) {
                    if (data.invitations) setPendingInvites(data.invitations);
                    toast.success('User successfully invited');
                }
                setOpen(false);
                form.reset();
            }
        });
    };

    const onCancel = () => {
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div>
                    {trigger === 'members' && (
                        <Button size="sm" className="cursor-pointer">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Member
                        </Button>
                    )}
                    {trigger === 'team' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite
                        </Button>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Invite someone to join <strong>{teamName}</strong>.
                        They&apos;ll receive an email with instructions to join.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name *</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address *</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className="text-sm text-muted-foreground">
                                They&apos;ll receive an invitation email to join
                                the team.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role *</FormLabel>
                                        <Select
                                            {...field}
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            name="role"
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="TEAM_MEMBER">
                                                    <div className="flex items-center gap-20">
                                                        <Users className="h-4 w-4" />
                                                        <div>
                                                            <div className="font-medium">
                                                                Member
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Can manage tasks
                                                                and view team
                                                                data
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="TEAM_ADMIN">
                                                    <div className="flex items-center gap-20">
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        <div>
                                                            <div className="font-medium">
                                                                Admin
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Full team
                                                                management
                                                                permissions
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={companyPlan.colour}
                                    className="text-xs"
                                >
                                    {companyPlan.name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {currentMemberCount} members
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isPending}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="cursor-pointer"
                                >
                                    {isPending && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    Send Invite
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

