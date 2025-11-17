'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

// -------------------------------
// Theme Definitions
// -------------------------------
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
    } & (
        | { color?: string; theme?: never }
        | { color?: never; theme: Record<keyof typeof THEMES, string> }
    );
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error('useChart must be used within a <ChartContainer />');
    }
    return context;
}

// -------------------------------
// Container
// -------------------------------
const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<'div'> & {
        config: ChartConfig;
        children: React.ComponentProps<
            typeof RechartsPrimitive.ResponsiveContainer
        >['children'];
    }
>(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                ref={ref}
                className={cn(
                    'flex aspect-video justify-center text-xs',
                    '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
                    "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
                    '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border',
                    "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
                    '[&_.recharts-layer]:outline-none',
                    "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
                    '[&_.recharts-radial-bar-background-sector]:fill-muted',
                    '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted',
                    "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
                    "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
                    '[&_.recharts-sector]:outline-none',
                    '[&_.recharts-surface]:outline-none',
                    className
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = 'Chart';

// -------------------------------
// Style Element
// -------------------------------
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
    const colorConfig = Object.entries(config).filter(
        ([, cfg]) => cfg.theme || cfg.color
    );

    if (!colorConfig.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(([theme, prefix]) => {
                        return `
${prefix} [data-chart=${id}] {
${colorConfig
    .map(([key, itemConfig]) => {
        const color =
            itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
            itemConfig.color;
        return color ? `  --color-${key}: ${color};` : '';
    })
    .join('\n')}
}
`;
                    })
                    .join('\n')
            }}
        />
    );
};

// -------------------------------
// Tooltip Types (Recharts v3)
// -------------------------------
export interface TooltipPayload<ValueType = number, NameType = string> {
    value: ValueType;
    name: NameType;
    dataKey?: string | number;
    color?: string;
    type?: string;
    unit?: string;
    payload?: Record<string, any>;
}

export interface ChartTooltipContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    label?: string | number;
    payload?: TooltipPayload[];
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
    color?: string;
    formatter?: (
        value: any,
        name: string,
        entry: TooltipPayload,
        index: number,
        raw: any
    ) => React.ReactNode;
    labelFormatter?: (label: any, payload: TooltipPayload[]) => React.ReactNode;
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

// -------------------------------
// Tooltip Content (Fully Recharts v3 compatible)
// -------------------------------
const ChartTooltipContent = React.forwardRef<
    HTMLDivElement,
    ChartTooltipContentProps
>(
    (
        {
            active,
            payload = [],
            label,
            className,
            hideLabel = false,
            hideIndicator = false,
            indicator = 'dot',
            formatter,
            labelFormatter,
            labelKey,
            nameKey,
            color,
            ...props
        },
        ref
    ) => {
        const { config } = useChart();

        const tooltipLabel = React.useMemo(() => {
            if (hideLabel || !payload.length) return null;

            const [item] = payload;
            const resolvedKey = `${labelKey || item.dataKey || item.name || 'value'}`;
            const itemConfig = getPayloadConfig(config, item, resolvedKey);

            const baseLabel =
                !labelKey && typeof label === 'string'
                    ? config[label]?.label || label
                    : itemConfig?.label;

            if (labelFormatter) {
                return (
                    <div className="font-medium">
                        {labelFormatter(baseLabel, payload)}
                    </div>
                );
            }

            return baseLabel ? (
                <div className="font-medium">{baseLabel}</div>
            ) : null;
        }, [payload, label, hideLabel, labelFormatter, labelKey, config]);

        if (!active || !payload.length) return null;

        const nestLabel = payload.length === 1 && indicator !== 'dot';

        return (
            <div
                ref={ref}
                className={cn(
                    'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
                    className
                )}
                {...props}
            >
                {!nestLabel && tooltipLabel}

                <div className="grid gap-1.5">
                    {payload.map((item, index) => {
                        const resolvedKey = `${nameKey || item.dataKey || item.name || 'value'}`;
                        const itemConfig = getPayloadConfig(
                            config,
                            item,
                            resolvedKey
                        );
                        const itemColor =
                            color || item.payload?.fill || item.color;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'flex w-full flex-wrap items-stretch gap-2',
                                    indicator === 'dot' && 'items-center'
                                )}
                            >
                                {formatter &&
                                item.value !== undefined &&
                                item.name ? (
                                    formatter(
                                        item.value,
                                        item.name,
                                        item,
                                        index,
                                        item.payload
                                    )
                                ) : (
                                    <>
                                        {!hideIndicator && (
                                            <div
                                                className={cn(
                                                    'shrink-0 rounded-[2px]',
                                                    indicator === 'dot' &&
                                                        'h-2.5 w-2.5',
                                                    indicator === 'line' &&
                                                        'h-2.5 w-1',
                                                    indicator === 'dashed' &&
                                                        'w-0 border-[1.5px] border-dashed bg-transparent'
                                                )}
                                                style={{
                                                    backgroundColor: itemColor
                                                }}
                                            />
                                        )}

                                        <div
                                            className={cn(
                                                'flex flex-1 justify-between leading-none',
                                                nestLabel
                                                    ? 'items-end'
                                                    : 'items-center'
                                            )}
                                        >
                                            <div className="grid gap-1.5">
                                                {nestLabel && tooltipLabel}
                                                <span className="text-muted-foreground">
                                                    {itemConfig?.label ||
                                                        item.name}
                                                </span>
                                            </div>

                                            {item.value !== undefined && (
                                                <span className="font-mono font-medium tabular-nums text-foreground">
                                                    {item.value.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);
ChartTooltipContent.displayName = 'ChartTooltip';

// -------------------------------
// Legend
// -------------------------------
export const ChartLegend = RechartsPrimitive.Legend;

export interface ChartLegendContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    payload?: Array<{
        value: string;
        id?: any;
        type?: string;
        dataKey?: string | number;
        color?: string;
    }>;
    verticalAlign?: 'top' | 'bottom';
    hideIcon?: boolean;
    nameKey?: string;
}

const ChartLegendContent = React.forwardRef<
    HTMLDivElement,
    ChartLegendContentProps
>(
    (
        {
            payload = [],
            className,
            verticalAlign = 'bottom',
            hideIcon = false,
            nameKey
        },
        ref
    ) => {
        const { config } = useChart();

        if (!payload.length) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-center gap-4',
                    verticalAlign === 'top' ? 'pb-3' : 'pt-3',
                    className
                )}
            >
                {payload.map((item, index) => {
                    const resolvedKey = `${nameKey || item.dataKey || 'value'}`;
                    const itemConfig = config[resolvedKey];

                    return (
                        <div key={index} className="flex items-center gap-1.5">
                            {!hideIcon ? (
                                <div
                                    className="h-2 w-2 shrink-0 rounded-[2px]"
                                    style={{ backgroundColor: item.color }}
                                />
                            ) : null}
                            {itemConfig?.label || item.value}
                        </div>
                    );
                })}
            </div>
        );
    }
);

ChartLegendContent.displayName = 'ChartLegend';

// -------------------------------
// Config Resolver
// -------------------------------
function getPayloadConfig(
    config: ChartConfig,
    item: TooltipPayload,
    key: string
) {
    const fromPayload =
        item.payload && typeof item.payload[key] === 'string'
            ? item.payload[key]
            : undefined;

    const resolved = fromPayload || key;

    return config[resolved] || config[key];
}

// -------------------------------
export { ChartContainer, ChartTooltipContent, ChartLegendContent, ChartStyle };
