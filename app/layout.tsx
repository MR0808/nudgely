import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/providers/theme-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import siteMetadata from '@/utils/siteMetaData';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { LoadingBar } from '@/components/layout/LoadingBar';
import { SiteHeader } from '@/components/layout/SiteHeader';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export const metadata: Metadata = {
    metadataBase: new URL(siteMetadata.siteUrl),
    title: {
        template: `${siteMetadata.title} | %s`,
        default: siteMetadata.title // a default is required when creating a template
    },
    applicationName: siteMetadata.title,
    description: siteMetadata.description,
    appleWebApp: {
        title: siteMetadata.title,
        statusBarStyle: 'default',
        capable: true
    },
    openGraph: {
        title: siteMetadata.title,
        description: siteMetadata.description,
        url: siteMetadata.siteUrl,
        siteName: siteMetadata.title,
        images: [siteMetadata.siteLogo],
        locale: 'en_AU',
        type: 'website'
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
        }
    },
    twitter: {
        card: 'summary_large_image',
        title: siteMetadata.title,
        images: [siteMetadata.siteLogo]
    }
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SidebarProvider
                        style={
                            {
                                '--sidebar-width': 'calc(var(--spacing) * 72)',
                                '--header-height': 'calc(var(--spacing) * 12)'
                            } as React.CSSProperties
                        }
                        className="group/layout"
                    >
                        <AppSidebar variant="inset" />
                        <SidebarInset>
                            <LoadingBar />
                            <SiteHeader />
                            <div className="flex flex-1 flex-col">
                                <div className="@container/main flex flex-1 flex-col gap-2">
                                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                        {children}
                                    </div>
                                </div>
                            </div>
                            <Toaster richColors />
                        </SidebarInset>
                    </SidebarProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
