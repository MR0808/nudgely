'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    totalItems: number;
    currentPage: number;
    pageSize: number;
}

export function Pagination({
    totalItems,
    currentPage,
    pageSize
}: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
    const isShowingAll = pageSize === -1;

    const updateSearchParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        if (key === 'pageSize') {
            params.set('page', '1'); // Reset to page 1 when changing page size
        }
        router.push(`?${params.toString()}`);
    };

    const showingFrom = isShowingAll ? 1 : (currentPage - 1) * pageSize + 1;
    const showingTo = isShowingAll
        ? totalItems
        : Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        Items per page:
                    </p>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) =>
                            updateSearchParams('pageSize', value)
                        }
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="-1">All</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <p className="text-sm text-muted-foreground">
                    Showing {showingFrom} to {showingTo} of {totalItems} items
                </p>
            </div>

            {!isShowingAll && totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            updateSearchParams(
                                'page',
                                (currentPage - 1).toString()
                            )
                        }
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-1">
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            updateSearchParams(
                                'page',
                                (currentPage + 1).toString()
                            )
                        }
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
