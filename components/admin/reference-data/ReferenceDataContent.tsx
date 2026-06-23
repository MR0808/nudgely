import {
    getReferenceDataSummary,
    getIndustries,
    getCompanySizes,
    getCountries
} from '@/actions/admin/reference-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export async function ReferenceDataContent() {
    const [summary, industries, companySizes, countries] = await Promise.all([
        getReferenceDataSummary(),
        getIndustries(),
        getCompanySizes(),
        getCountries(25)
    ]);

    const summaryItems = [
        { label: 'Countries', value: summary.countries },
        { label: 'Regions', value: summary.regions },
        { label: 'Continents', value: summary.continents },
        { label: 'Currencies', value: summary.currencies },
        { label: 'Industries', value: summary.industries },
        { label: 'Company sizes', value: summary.companySizes },
        { label: 'Plans', value: summary.plans }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryItems.map((item) => (
                    <Card key={item.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{item.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Industries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {industries.map((industry) => (
                        <div
                            key={industry.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <span>{industry.name}</span>
                            <Badge variant="secondary">
                                {industry._count.companies} companies
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Company sizes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {companySizes.map((size) => (
                        <div
                            key={size.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <span>
                                {size.name} ({size.size})
                            </span>
                            <Badge variant="secondary">
                                {size._count.companies} companies
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Countries (first 25)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {countries.map((country) => (
                        <div
                            key={country.id}
                            className="flex items-center justify-between text-sm"
                        >
                            <span>{country.name}</span>
                            <Badge variant="secondary">
                                {country._count.companies} companies
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
                Reference data is loaded from seed CSVs. Use{' '}
                <code className="text-xs">npm run db:seed</code> to refresh
                after editing files in <code className="text-xs">prisma/seed/data</code>.
            </p>
        </div>
    );
}
