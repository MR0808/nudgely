'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    MoreVertical,
    Ban,
    CheckCircle,
    CreditCard,
    Gift,
    CalendarPlus
} from 'lucide-react';
import {
    toggleCompanyStatus,
    banCompany,
    deleteCompany,
    grantFreePlan,
    extendTrial,
    changePlan
} from '@/actions/admin/companies';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Company = {
    id: string;
    name: string;
    status: string;
    banned?: boolean | null;
};

type Plan = {
    id: string;
    name: string;
    slug: string;
};

export function CompanyActions({
    company,
    plans
}: {
    company: Company;
    plans: Plan[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showBanDialog, setShowBanDialog] = useState(false);
    const [showFreePlanDialog, setShowFreePlanDialog] = useState(false);
    const [showExtendTrialDialog, setShowExtendTrialDialog] = useState(false);
    const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [trialDays, setTrialDays] = useState('30');
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const handleToggleStatus = () => {
        startTransition(async () => {
            try {
                await toggleCompanyStatus(company.id);
                toast.success(
                    `Company ${company.status === 'ACTIVE' ? 'disabled' : 'enabled'} successfully`
                );
                router.refresh();
            } catch (error) {
                toast.error('Failed to update company status');
            }
        });
    };

    const handleBan = () => {
        if (!banReason.trim()) {
            toast.error('Please provide a ban reason');
            return;
        }

        startTransition(async () => {
            try {
                await banCompany(company.id, banReason);
                toast.success('Company banned successfully');
                setShowBanDialog(false);
                setBanReason('');
                router.refresh();
            } catch (error) {
                toast.error('Failed to ban company');
            }
        });
    };

    const handleDelete = () => {
        if (
            !confirm(
                `Are you sure you want to delete ${company.name}? This will disable the company.`
            )
        ) {
            return;
        }

        startTransition(async () => {
            try {
                await deleteCompany(company.id);
                toast.success('Company deleted successfully');
                router.refresh();
            } catch (error) {
                toast.error('Failed to delete company');
            }
        });
    };

    const handleGrantFreePlan = () => {
        startTransition(async () => {
            try {
                await grantFreePlan(company.id);
                toast.success('Free plan granted successfully');
                setShowFreePlanDialog(false);
                router.refresh();
            } catch (error) {
                toast.error('Failed to grant free plan');
            }
        });
    };

    const handleExtendTrial = () => {
        const days = parseInt(trialDays);
        if (isNaN(days) || days <= 0) {
            toast.error('Please enter a valid number of days');
            return;
        }

        startTransition(async () => {
            try {
                await extendTrial(company.id, days);
                toast.success(`Trial extended by ${days} days`);
                setShowExtendTrialDialog(false);
                setTrialDays('30');
                router.refresh();
            } catch (error) {
                toast.error('Failed to extend trial');
            }
        });
    };

    const handleChangePlan = () => {
        if (!selectedPlanId) {
            toast.error('Please select a plan');
            return;
        }

        startTransition(async () => {
            try {
                await changePlan(company.id, selectedPlanId);
                toast.success('Plan changed successfully');
                setShowChangePlanDialog(false);
                setSelectedPlanId('');
                router.refresh();
            } catch (error) {
                toast.error('Failed to change plan');
            }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                        onClick={() => setShowChangePlanDialog(true)}
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Change Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowFreePlanDialog(true)}
                    >
                        <Gift className="h-4 w-4 mr-2" />
                        Grant Free Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowExtendTrialDialog(true)}
                    >
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Extend Trial
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {company.status === 'ACTIVE' ? (
                        <DropdownMenuItem
                            onClick={handleToggleStatus}
                            className="text-orange-600"
                        >
                            Disable Company
                        </DropdownMenuItem>
                    ) : company.status === 'DISABLED' ? (
                        <DropdownMenuItem
                            onClick={handleToggleStatus}
                            className="text-green-600"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enable Company
                        </DropdownMenuItem>
                    ) : null}
                    {company.status !== 'BANNED' && (
                        <DropdownMenuItem
                            onClick={() => setShowBanDialog(true)}
                            className="text-destructive"
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban Company
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                    >
                        Delete Company
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Ban Dialog */}
            <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban Company</DialogTitle>
                        <DialogDescription>
                            Provide a reason for banning {company.name}. This
                            will prevent all company members from accessing the
                            platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="banReason">Ban Reason</Label>
                            <Textarea
                                id="banReason"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter reason for ban..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowBanDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBan}
                            disabled={isPending}
                        >
                            Ban Company
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grant Free Plan Dialog */}
            <Dialog
                open={showFreePlanDialog}
                onOpenChange={setShowFreePlanDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Grant Free Plan</DialogTitle>
                        <DialogDescription>
                            Grant {company.name} lifetime free access to their
                            current plan. This will cancel any active
                            subscription.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowFreePlanDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGrantFreePlan}
                            disabled={isPending}
                        >
                            Grant Free Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Extend Trial Dialog */}
            <Dialog
                open={showExtendTrialDialog}
                onOpenChange={setShowExtendTrialDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extend Trial</DialogTitle>
                        <DialogDescription>
                            Extend the trial period for {company.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="trialDays">Number of Days</Label>
                            <Input
                                id="trialDays"
                                type="number"
                                value={trialDays}
                                onChange={(e) => setTrialDays(e.target.value)}
                                placeholder="30"
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowExtendTrialDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExtendTrial}
                            disabled={isPending}
                        >
                            Extend Trial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Plan Dialog */}
            <Dialog
                open={showChangePlanDialog}
                onOpenChange={setShowChangePlanDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Plan</DialogTitle>
                        <DialogDescription>
                            Change the subscription plan for {company.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="plan">Select Plan</Label>
                            <Select
                                value={selectedPlanId}
                                onValueChange={setSelectedPlanId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem
                                            key={plan.id}
                                            value={plan.id}
                                        >
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowChangePlanDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleChangePlan} disabled={isPending}>
                            Change Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
