'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { UserPlus, Loader2, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InviteCompanyMemberDialogProps } from '@/types/company';
import { InviteCompanyAdminSchema } from '@/schemas/companyMember';
import { inviteCompanyAdmin } from '@/actions/companyMembers';

const InviteCompanyMemberDialog = ({
    companyId,
    companyName,
    companyPlan,
    currentMemberCount,
    setMembers,
    setPendingInvites,
    trigger
}: InviteCompanyMemberDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof InviteCompanyAdminSchema>>({
        resolver: zodResolver(InviteCompanyAdminSchema),
        defaultValues: {
            name: '',
            email: ''
        }
    });

    const onSubmit = (values: z.infer<typeof InviteCompanyAdminSchema>) => {
        setError(null);
        startTransition(async () => {
            const data = await inviteCompanyAdmin(values, companyId);
            if (data.error) {
                setError(data.error || 'Failed to send invitation');
                toast.error(data.error);
            }
            if (data.success) {
                if (data.method === 'added') {
                    if (data.members) setMembers(data.members);
                    toast.success('User successfully added');
                }
                if (data.method === 'invited') {
                    if (data.invitations) setPendingInvites(data.invitations);
                    toast.success('User successfully invited');
                }
                setOpen(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 cursor-pointer">
                        <UserPlus className="h-4 w-4" />
                        Add Admin
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Add Company Admin
                    </DialogTitle>
                    <DialogDescription>
                        Invite someone to join <strong>{companyName}</strong> as
                        an admin. If they are already a team member, they will
                        automatically be promoted to company admin (and admin of
                        their team(s)), otherwise, they will receive
                        instructions via email.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        data-company-invite-form
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
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        companyPlan === 'GROWTH'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {companyPlan}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {currentMemberCount} admin
                                    {currentMemberCount > 1 && 's'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
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
};

export default InviteCompanyMemberDialog;
