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

export function UserFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [role, setRole] = useState(searchParams.get('role') || 'all');

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status !== 'all') params.set('status', status);
        if (role !== 'all') params.set('role', role);

        startTransition(() => {
            router.push(`/admin/users?${params.toString()}`);
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setRole('all');
        startTransition(() => {
            router.push('/admin/users');
        });
    };

    const hasFilters = search || status !== 'all' || role !== 'all';

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or phone..."
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

            <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="SITE_ADMIN">Site Admin</SelectItem>
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
