// hooks/usePageTitle.ts
'use client';

import { usePageTitleContext } from '@/providers/page-title-provider';

export function usePageTitle() {
    return usePageTitleContext();
}
