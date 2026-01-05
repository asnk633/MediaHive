"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";
import { SafeResponsiveContainer } from "@/components/SafeResponsiveContainer";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

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
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  // Recharts requires explicit client-side rendering to avoid hydration mismatches
  // and "width/height" warnings during server-side composition
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-dot]:fill-primary",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-dot]:fill-primary",
          className
        )}
        {...props}
      >
        <div className="h-full w-full">
          <div className="h-full w-full">
            <SafeResponsiveContainer>{children}</SafeResponsiveContainer>
          </div>
        </div>
      </div>
    </ChartContext.Provider>
  );
}
ChartContainer.displayName = "ChartContainer";

// Note: Recharts types are internal and can sometimes clash with external types.
// We use a local helper function to avoid exporting the Recharts types.
type LegendProps = React.ComponentProps<typeof RechartsPrimitive.Legend> & ChartConfig & {
  /**
   * @default true
   */
  hideIcon?: boolean;
  /**
   * Optional custom function to handle when a legend item is clicked.
   * Receives the full legend item payload as argument.
   */
  onLegendItemClick?: (item: any) => void;
};

// Use a tolerant `any` signature because Recharts typings vary between versions.
const LegendWrapper = (props: any) => {
  const { payload = [], className } = props as any;
  const { config } = useChart();

  const isPieOrRadial = Array.isArray(payload) && payload.every((item: any) => Boolean(item.payload?.name || item.name));

  const defaultLegend = (
    <RechartsPrimitive.Legend
      // content receives various args from recharts; use any to avoid typing mismatches
      content={({ payload: contentPayload = [], ...contentProps }: any) => {
        const hideIcon = contentProps?.hideIcon ?? false;
        const onLegendItemClick = contentProps?.onLegendItemClick ?? props.onLegendItemClick;
        const contentClass = contentProps?.className ?? "";

        const items = (Array.isArray(contentPayload) ? contentPayload : []).map((item: any, index: number) => {
          const key = item.value ?? item.name;
          if (!key) return null;

          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          const color = itemConfig?.color ?? item.color ?? undefined;

          return (
            <div
              key={index}
              className={cn("flex items-center gap-1.5", item.inactive && "text-muted")}
              onClick={() => onLegendItemClick?.(item)}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: color,
                  }}
                />
              )}
              <div className="ml-1">{itemConfig?.label ?? item.value ?? item.name}</div>
            </div>
          );
        });

        return (
          <div className={cn("flex flex-wrap items-center justify-center gap-2", contentClass)}>
            {items}
          </div>
        );
      }}
    />
  );

  const legendEl = props.children ? React.Children.only(props.children) : defaultLegend;

  if (!legendEl) {
    return null;
  }

  // --- START CUSTOM PIE/RADIAL RENDERING ---
  if (isPieOrRadial) {
    // clone element but avoid passing unknown props. Merge className only.
    const child = React.cloneElement(legendEl as React.ReactElement, {
      // cast props to any to avoid TS error about spreading unknown
      ...((legendEl as React.ReactElement).props as any),
      className: [((legendEl as React.ReactElement).props as any).className || "", className || ""]
        .filter(Boolean)
        .join(" "),
    } as any);

    return (
      <div className="pt-2 text-sm font-medium">
        <ul className="flex flex-wrap items-center justify-center gap-4 text-center">
          {child}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-center sm:grid-cols-4">
          {(Array.isArray(payload) ? payload : []).map((item: any, index: number) => {
            const key = item?.value ?? item?.name ?? index;
            return (
              <li key={key}>
                <span className="legend-item-label">{item?.value ?? item?.name}</span>
              </li>
            );
          })}
        </div>
      </div>
    );
  }
  // --- END CUSTOM PIE/RADIAL RENDERING ---

  // default legend (for bar/line charts, etc.)
  return (
    <div className="pt-2 text-sm font-medium">
      <div className="grid grid-cols-2 gap-y-1.5 text-center sm:grid-cols-4">
        {(Array.isArray(payload) ? payload : []).map((item: any, index: number) => {
          const key = item?.value ?? item?.name ?? index;
          return (
            <div key={key} className="chart-legend-row">
              {item?.payload && <span className="legend-dot" />}
              <span className="legend-text">{item?.value ?? item?.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

LegendWrapper.displayName = "LegendWrapper";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in (payload as any) && typeof (payload as any).payload === "object" && (payload as any).payload !== null
      ? (payload as any).payload
      : undefined;

  let configLabelKey: string = key;

  if (key in (payload as any) && typeof (payload as any)[key] === "string") {
    configLabelKey = (payload as any)[key] as string;
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key as keyof typeof payloadPayload] === "string") {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return config[configLabelKey];
}

const ChartPrimitive = {
  Area: RechartsPrimitive.Area,
  AreaChart: RechartsPrimitive.AreaChart,
  Bar: RechartsPrimitive.Bar,
  BarChart: RechartsPrimitive.BarChart,
  Line: RechartsPrimitive.Line,
  LineChart: RechartsPrimitive.LineChart,
  Pie: RechartsPrimitive.Pie,
  PieChart: RechartsPrimitive.PieChart,
  RadialBar: RechartsPrimitive.RadialBar,
  RadialBarChart: RechartsPrimitive.RadialBarChart,
  XAxis: RechartsPrimitive.XAxis,
  YAxis: RechartsPrimitive.YAxis,
  CartesianGrid: RechartsPrimitive.CartesianGrid,
  Tooltip: RechartsPrimitive.Tooltip,
  Legend: LegendWrapper,
  Label: RechartsPrimitive.Label,
  LabelList: RechartsPrimitive.LabelList,
  ReferenceLine: RechartsPrimitive.ReferenceLine,
  Cell: RechartsPrimitive.Cell,
  Rectangle: RechartsPrimitive.Rectangle,
  PolarAngleAxis: RechartsPrimitive.PolarAngleAxis,
  PolarGrid: RechartsPrimitive.PolarGrid,
  PolarRadiusAxis: RechartsPrimitive.PolarRadiusAxis,
  Sector: RechartsPrimitive.Sector,
};

export { ChartContainer, ChartPrimitive };
