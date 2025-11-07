// hooks/usePageTitle.ts
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPageTitleAsync } from '@/lib/page-title';

/**
 * usePageTitle()
 *  - Prefers metadata.title (from generateMetadata)
 *  - Falls back to async DB/static lookup
 *  - Automatically cleans "Nudgely | " prefix
 */
export function usePageTitle(defaultTitle = 'Page') {
    const pathname = usePathname();
    const [title, setTitle] = useState(defaultTitle);

    useEffect(() => {
        // 1️⃣ Try to read from document.title (Next.js metadata)
        const docTitle = document.title;
        if (docTitle) {
            const cleanTitle = docTitle.replace(/^Nudgely\s*\|\s*/i, '').trim();
            setTitle(cleanTitle);
            return;
        }

        // 2️⃣ Otherwise, async lookup from DB/static config
        getPageTitleAsync(pathname).then(setTitle);
    }, [pathname]);

    return title;
}
