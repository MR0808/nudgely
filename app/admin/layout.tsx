import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/30">
                <div className="container mx-auto p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
