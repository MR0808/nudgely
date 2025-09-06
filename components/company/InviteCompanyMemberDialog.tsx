'use client';

import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    UserPlus,
    Loader2,
    Crown,
    Users,
    CheckCircle,
    Building2
} from 'lucide-react';
import { inviteCompanyMember } from '@/actions/companyMembers';
import { InviteCompanyMemberDialogProps } from '@/types/company';

const InviteCompanyMemberDialog = ({
    companyId,
    companyName,
    companyPlan,
    currentMemberCount,
    trigger
}: InviteCompanyMemberDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const email = formData.get('email') as string;
            const role = formData.get('role') as
                | 'COMPANY_ADMIN'
                | 'COMPANY_MEMBER';

            console.log('[v0] Inviting company member:', {
                email,
                role,
                companyId
            });

            const result = await inviteCompanyMember({
                companyId,
                email,
                role
            });

            if (result.success) {
                setSuccess(`Invitation sent to ${email}`);

                // Reset form after success
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(null);
                    // Reset form
                    const form = document.querySelector(
                        'form[data-company-invite-form]'
                    ) as HTMLFormElement;
                    if (form) form.reset();
                }, 2000);
            } else {
                setError(result.error || 'Failed to send invitation');
            }
        } catch (err) {
            console.error('Failed to send invitation:', err);
            setError('Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    }

    const canInviteMembers = companyPlan === 'PRO' || currentMemberCount < 10;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="sm"
                        disabled={!canInviteMembers}
                        className="gap-2 cursor-pointer"
                    >
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Invite Company Member
                    </DialogTitle>
                    <DialogDescription>
                        Invite someone to join <strong>{companyName}</strong>.
                        They&apos;ll receive an email with instructions to join
                        your company.
                    </DialogDescription>
                </DialogHeader>

                {!canInviteMembers && (
                    <Alert>
                        <AlertDescription>
                            {companyPlan === 'FREE'
                                ? 'Free plan is limited to 10 company members. Upgrade to Pro for unlimited members.'
                                : 'Member limit reached for your current plan.'}
                        </AlertDescription>
                    </Alert>
                )}

                {canInviteMembers && (
                    <form
                        action={handleSubmit}
                        data-company-invite-form
                        className="space-y-4"
                    >
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="border-emerald-200 bg-emerald-50">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <AlertDescription className="text-emerald-800">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="colleague@company.com"
                                required
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                They&apos;ll receive an invitation email to join
                                the company.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Company Role</Label>
                            <Select
                                name="role"
                                defaultValue="COMPANY_MEMBER"
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COMPANY_MEMBER">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <div>
                                                <div className="font-medium">
                                                    Member
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Can join teams and manage
                                                    tasks
                                                </div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="COMPANY_ADMIN">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-amber-500" />
                                            <div>
                                                <div className="font-medium">
                                                    Admin
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Full company management
                                                    permissions
                                                </div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Admins can manage billing, create teams, and
                                invite members. Members can join teams and
                                manage tasks.
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        companyPlan === 'PRO'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {companyPlan}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {currentMemberCount} members
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    Send Invite
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default InviteCompanyMemberDialog;
