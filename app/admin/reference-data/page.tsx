import { authCheckAdmin } from '@/lib/authCheck';
import { ReferenceDataContent } from '@/components/admin/reference-data/ReferenceDataContent';

export default async function AdminReferenceDataPage() {
    await authCheckAdmin('/admin/reference-data');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Reference data
                </h1>
                <p className="text-muted-foreground mt-2">
                    Countries, industries, company sizes, and other lookup tables
                </p>
            </div>
            <ReferenceDataContent />
        </div>
    );
}
