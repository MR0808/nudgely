import { checkCompanyStatus } from '@/actions/company';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CompanySetupBanner } from '@/components/layout/CompanySetupBanner';
import { LoadingBar } from '@/components/layout/LoadingBar';
import ServerSidebar from '@/components/layout/ServerSidebar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CompanyStatus } from '@/generated/prisma';

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const res = await checkCompanyStatus();
    if (!res.success) {
        // not authorised
        // e.g. redirect to login / show error
        return;
    }
    const companyStatus = res.data!;
    const showBanner =
        companyStatus?.isCompanyAdmin &&
        !companyStatus.isComplete &&
        companyStatus.missingFields.length > 0;
    return (
        <>
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
        </>
    );
}
