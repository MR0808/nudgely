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
        let active = true;
        (async () => {
            const docTitle = document.title;
            if (docTitle) {
                setTitle(docTitle.replace(/^Nudgely\s*\|\s*/i, '').trim());
            } else {
                const newTitle = await getPageTitleAsync(pathname);
                if (active) setTitle(newTitle);
            }
        })();
        return () => {
            active = false;
        };
    }, [pathname]);

    return title;
}
