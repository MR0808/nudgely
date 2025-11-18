import Link from 'next/link';
import { AlertCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CompanySetupBannerProps {
    companyName: string | null;
    missingFields: string[];
}

export function CompanySetupBanner({
    companyName,
    missingFields
}: CompanySetupBannerProps) {
    return (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Complete your company profile
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Your company profile is missing required information:{' '}
                        {missingFields.slice(0, 3).join(', ')}
                        {missingFields.length > 3 &&
                            ` and ${missingFields.length - 3} more`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                    >
                        <Link href="/onboarding">Complete Setup</Link>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                    >
                        <Link href="/company">
                            <Settings className="h-4 w-4 mr-1" />
                            Settings
                        </Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
