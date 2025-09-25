'use client';

import { memo } from 'react';
import {
    Zap,
    Rocket,
    Building,
    Star,
    Heart,
    Shield,
    Crown,
    Diamond,
    Gem,
    Trophy,
    Target,
    Flame,
    Sparkles,
    Check,
    HelpCircle,
    type LucideIcon,
    Building2
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    Zap,
    Rocket,
    Building,
    Building2,
    Star,
    Heart,
    Shield,
    Crown,
    Diamond,
    Gem,
    Trophy,
    Target,
    Flame,
    Sparkles,
    Check,
    HelpCircle
};

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
}

export const DynamicIcon = memo(function DynamicIcon({
    name,
    className,
    size = 24
}: DynamicIconProps) {
    const IconComponent = iconMap[name] || iconMap.HelpCircle;

    return <IconComponent className={className} size={size} />;
});
