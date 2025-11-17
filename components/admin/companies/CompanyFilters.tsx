'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function CompanyFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [plan, setPlan] = useState(searchParams.get('plan') || 'all');

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status !== 'all') params.set('status', status);
        if (plan !== 'all') params.set('plan', plan);

        startTransition(() => {
            router.push(`/admin/companies?${params.toString()}`);
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setPlan('all');
        startTransition(() => {
            router.push('/admin/companies');
        });
    };

    const hasFilters = search || status !== 'all' || plan !== 'all';

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="pl-9"
                />
            </div>

            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                </SelectContent>
            </Select>

            <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
            </Select>

            <Button onClick={applyFilters} disabled={isPending}>
                Apply
            </Button>

            {hasFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    disabled={isPending}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
