// providers/PageTitleProvider.tsx
'use client';

import { createContext, useContext } from 'react';

const PageTitleContext = createContext<string>('Nudgely');

type PageTitleProviderProps = {
    value: string;
    children: React.ReactNode;
};

export function PageTitleProvider({ value, children }: PageTitleProviderProps) {
    return (
        <PageTitleContext.Provider value={value}>
            {children}
        </PageTitleContext.Provider>
    );
}

export function usePageTitleContext() {
    return useContext(PageTitleContext);
}
