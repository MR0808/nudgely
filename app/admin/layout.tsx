import { AdminShell } from '@/components/admin/AdminShell';
import { authCheckAdmin } from '@/lib/authCheck';

export default async function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    await authCheckAdmin('/admin');

    return <AdminShell>{children}</AdminShell>;
}
