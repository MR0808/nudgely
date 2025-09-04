'use client';

import { differenceInDays } from 'date-fns';
import { useState } from 'react';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    MapPin,
    Mail,
    Phone,
    Edit,
    Crown,
    Clock
} from 'lucide-react';
import { CompanyProps } from '@/types/company';
import EditCompanyDialog from '@/components/company/EditCompanyDialog';
import Image from 'next/image';

const CompanyDetails = ({ company, userRole, image }: CompanyProps) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    let isTrialing = false;
    let trialDaysLeft = 0;
    const today = new Date();
    const phoneNumber = company.contactPhone
        ? parsePhoneNumber(company.contactPhone)
        : undefined;

    if (company.trialEndsAt && company.trialEndsAt > today) {
        isTrialing = true;
        trialDaysLeft = differenceInDays(today, company.trialEndsAt);
    }
    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Details
                        </CardTitle>
                        <CardDescription>
                            Manage your company information and settings
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent cursor-pointer"
                        onClick={() => setIsEditDialogOpen(true)}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Details
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Company Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {image ? (
                                <Image
                                    src={image.image}
                                    alt={company.name}
                                    width={200}
                                    height={200}
                                    className="h-8"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-primary-foreground" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-semibold">
                                    {company.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant={
                                            company.plan === 'PRO'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="gap-1"
                                    >
                                        {company.plan === 'PRO' && (
                                            <Crown className="h-3 w-3" />
                                        )}
                                        {company.plan}
                                    </Badge>
                                    {isTrialing && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1"
                                        >
                                            <Clock className="h-3 w-3" />
                                            {trialDaysLeft} days left
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Info Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Address
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.address1}
                                    </p>
                                    {company.address2 && (
                                        <p className="text-sm text-muted-foreground">
                                            {company.address2}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        {company.city}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.contactEmail}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm text-muted-foreground">
                                        {phoneNumber
                                            ? phoneNumber.formatNational()
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">Website</p>
                                <p className="text-sm text-muted-foreground">
                                    {company.website}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Industry</p>
                                <p className="text-sm text-muted-foreground">
                                    {company.industry?.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    Company Size
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-bold">
                                        {company.companySize?.name}
                                    </span>
                                    &nbsp;{company.companySize?.size}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <EditCompanyDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                company={company}
            />
        </>
    );
};

export default CompanyDetails;
