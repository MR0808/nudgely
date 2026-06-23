'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updatePlan } from '@/actions/admin/plans';

type Plan = {
    id: string;
    name: string;
    headline: string;
    priceMonthly: number;
    priceYearly: number;
    maxUsers: number;
    maxTeams: number;
    maxNudges: number;
    popular: boolean;
};

export function PlanEditDialog({ plan }: { plan: Plan }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: plan.name,
        headline: plan.headline,
        priceMonthly: String(plan.priceMonthly),
        priceYearly: String(plan.priceYearly),
        maxUsers: String(plan.maxUsers),
        maxTeams: String(plan.maxTeams),
        maxNudges: String(plan.maxNudges),
        popular: plan.popular
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            await updatePlan(plan.id, {
                name: form.name,
                headline: form.headline,
                priceMonthly: parseInt(form.priceMonthly, 10),
                priceYearly: parseInt(form.priceYearly, 10),
                maxUsers: parseInt(form.maxUsers, 10),
                maxTeams: parseInt(form.maxTeams, 10),
                maxNudges: parseInt(form.maxNudges, 10),
                popular: form.popular
            });
            toast.success('Plan updated');
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Update failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {plan.name}</DialogTitle>
                </DialogHeader>
                <Alert>
                    <AlertDescription>
                        Changes here update the database only. Stripe prices
                        use lookup keys — update prices in the Stripe Dashboard
                        or run <code>npm run stripe:sync-plans</code> to keep
                        billing in sync.
                    </AlertDescription>
                </Alert>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                            id="headline"
                            value={form.headline}
                            onChange={(e) =>
                                setForm({ ...form, headline: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="priceMonthly">
                                Monthly price (cents)
                            </Label>
                            <Input
                                id="priceMonthly"
                                type="number"
                                value={form.priceMonthly}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        priceMonthly: e.target.value
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priceYearly">
                                Yearly price (cents)
                            </Label>
                            <Input
                                id="priceYearly"
                                type="number"
                                value={form.priceYearly}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        priceYearly: e.target.value
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="maxUsers">Max users</Label>
                            <Input
                                id="maxUsers"
                                type="number"
                                value={form.maxUsers}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        maxUsers: e.target.value
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxTeams">Max teams</Label>
                            <Input
                                id="maxTeams"
                                type="number"
                                value={form.maxTeams}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        maxTeams: e.target.value
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxNudges">Max nudges</Label>
                            <Input
                                id="maxNudges"
                                type="number"
                                value={form.maxNudges}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        maxNudges: e.target.value
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="popular">Mark as popular</Label>
                        <Switch
                            id="popular"
                            checked={form.popular}
                            onCheckedChange={(popular) =>
                                setForm({ ...form, popular })
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
