'use client';

import { useState } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { MenuOption, SettingsSidebarNavProps } from '@/types/settings';
import { sidebarNavItems } from '@/components/settings/SettingsMenuItems';

const SettingsSidebarNav = ({
    selectedOption,
    setSelectedOption
}: SettingsSidebarNavProps) => {
    const handleSelect = (e: MenuOption) => {
        setSelectedOption(e);
    };

    return (
        <>
            <div className="p-1 md:hidden">
                <Select value={selectedOption} onValueChange={handleSelect}>
                    <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                        {sidebarNavItems.map((item) => (
                            <SelectItem key={item.option} value={item.option}>
                                <div className="flex gap-x-4 px-2 py-1">
                                    <span className="scale-125">
                                        <item.icon size={18} />
                                    </span>
                                    <span className="text-md">
                                        {item.title}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <ScrollArea
                type="always"
                className="bg-background hidden w-full min-w-40 px-1 py-2 md:block"
            >
                <nav
                    className={cn(
                        'flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0'
                    )}
                >
                    {sidebarNavItems.map((item) => (
                        <div
                            key={item.option}
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                selectedOption === item.option
                                    ? 'bg-muted hover:bg-accent'
                                    : 'hover:bg-accent hover:underline',
                                'justify-start cursor-pointer'
                            )}
                            onClick={() => {
                                setSelectedOption(item.option);
                            }}
                        >
                            <span className="me-2">
                                <item.icon size={18} />
                            </span>
                            {item.title}
                        </div>
                    ))}
                </nav>
            </ScrollArea>
        </>
    );
};

export default SettingsSidebarNav;
