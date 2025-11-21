import { checkCompanyStatus } from '@/actions/company';
import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { CompanySetupBanner } from '@/components/layout/CompanySetupBanner';
import { LoadingBar } from '@/components/layout/LoadingBar';
import ServerSidebar from '@/components/layout/ServerSidebar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CompanyStatus } from '@/generated/prisma';
import { PageTitleProvider } from '@/providers/page-title-provider';
import {
    getStaticRouteTitle,
    getDynamicRouteTitle,
    cleanTitle
} from '@/lib/page-title';
import { headers } from 'next/headers';

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const res = await checkCompanyStatus();
    if (!res.success) {
        // not authorised
        // e.g. redirect to login / show error
        throw redirect('/auth/login');
    }
    const companyStatus = res.data!;
    const showBanner =
        companyStatus?.isCompanyAdmin &&
        !companyStatus.isComplete &&
        companyStatus.missingFields.length > 0;

    // Read pathname from middleware (Next 16 + Proxy friendly)
    const hdrs = await headers();
    const pathname = hdrs.get('x-pathname') ?? '/';

    // 1. Try static title first
    const staticTitle = getStaticRouteTitle(pathname);

    // 2. Try dynamic DB-backed title
    const dynamicTitle = await getDynamicRouteTitle(pathname);

    // 3. Decide final title, clean up any global prefix if needed
    const pageTitle = cleanTitle(dynamicTitle ?? staticTitle ?? 'Nudgely');
    return (
        <PageTitleProvider value={pageTitle}>
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': 'calc(var(--spacing) * 72)',
                        '--header-height': 'calc(var(--spacing) * 12)'
                    } as React.CSSProperties
                }
                className="group/layout"
            >
                <ServerSidebar />
                <SidebarInset>
                    {showBanner && (
                        <CompanySetupBanner
                            companyName={companyStatus.companyName}
                            missingFields={companyStatus.missingFields}
                        />
                    )}
                    <LoadingBar />
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </PageTitleProvider>
    );
}
