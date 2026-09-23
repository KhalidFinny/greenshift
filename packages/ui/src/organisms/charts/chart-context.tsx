"use client";

import type { scaleBand, scaleLinear, scaleTime } from "@visx/scale";

type ScaleLinear<Output, _Input = number> = ReturnType<
	typeof scaleLinear<Output>
>;
type ScaleTime<Output, _Input = Date | number> = ReturnType<
	typeof scaleTime<Output>
>;
type ScaleBand<Domain extends { toString(): string }> = ReturnType<
	typeof scaleBand<Domain>
>;

import type { Transition } from "motion/react";
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type RefObject,
	type SetStateAction,
	useContext,
	useMemo,
} from "react";
import type { ChartPhase, ChartStatus } from "./chart-phase";
import type { ReferenceAreaConfig } from "./reference-area-config";
import type { ChartSelection } from "./use-chart-interaction";
import { DEFAULT_Y_AXIS_ID } from "./y-axis-scales";
import type { YDomain } from "./y-domain-utils";

export const chartCssVars = {
	background: "var(--chart-background)",
	foreground: "var(--chart-foreground)",
	foregroundMuted: "var(--chart-foreground-muted)",
	label: "var(--chart-label)",
	linePrimary: "var(--chart-line-primary)",
	lineSecondary: "var(--chart-line-secondary)",
	crosshair: "var(--chart-crosshair)",
	grid: "var(--chart-grid)",
	indicatorColor: "var(--chart-indicator-color)",
	indicatorSecondaryColor: "var(--chart-indicator-secondary-color)",
	markerBackground: "var(--chart-marker-background)",
	markerBorder: "var(--chart-marker-border)",
	markerForeground: "var(--chart-marker-foreground)",
	badgeBackground: "var(--chart-marker-badge-background)",
	badgeForeground: "var(--chart-marker-badge-foreground)",
	segmentBackground: "var(--chart-segment-background)",
	segmentLine: "var(--chart-segment-line)",
	brushBorder: "var(--chart-brush-border)",
	tooltipBackground: "var(--chart-tooltip-background)",
};

export const defaultScatterColors = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
] as const;

export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface TooltipData {
	point: Record<string, unknown>;
	index: number;
	x: number;
	yPositions: Record<string, number>;
	xPositions?: Record<string, number>;
}

export interface LineConfig {
	dataKey: string;
	stroke: string;
	strokeWidth: number;
	/** Scale group id (Recharts `yAxisId`). Default: `"left"`. */
	yAxisId?: string | number;
}

/** Hover/selection state: every field changes on mouse movement. Lives in its own
 * context so cold consumers (Grid, YAxis, PatternArea, …) skip re-renders on hover. */
export interface ChartHoverContextValue {
	tooltipData: TooltipData | null;
	setTooltipData: Dispatch<SetStateAction<TooltipData | null>>;

	// Present only when useChartInteraction is used.
	selection?: ChartSelection | null;
	clearSelection?: () => void;

	// Present only in BarChart.
	hoveredBarIndex?: number | null;
	setHoveredBarIndex?: (index: number | null) => void;

	// Present only in CandlestickChart.
	hoveredCandleIndex?: number | null;
	setHoveredCandleIndex?: (index: number | null) => void;
}

export interface ChartContextValue extends ChartHoverContextValue {
	data: Record<string, unknown>[];
	/** Decimated subset for SVG path rendering; equals `data` when no decimation is needed. */
	renderData: Record<string, unknown>[];

	xScale: ScaleTime<number, number>;
	/** Primary (left) y-scale: alias for `yScales[DEFAULT_Y_AXIS_ID]`. */
	yScale: ScaleLinear<number, number>;
	/** Per-axis y-scales keyed by `yAxisId`. */
	yScales: Record<string, ScaleLinear<number, number>>;

	width: number;
	height: number;
	innerWidth: number;
	innerHeight: number;
	margin: Margin;

	columnWidth: number;

	containerRef: RefObject<HTMLDivElement | null>;

	// Extracted from children.
	lines: LineConfig[];

	/** {@link ReferenceArea} bands: drives y-axis label colors in range. */
	referenceAreas: ReferenceAreaConfig[];

	// Loading / lifecycle (LineChart).
	chartPhase: ChartPhase;
	chartStatus: ChartStatus;
	/** Centered label while `chartPhase` shows loading chrome. */
	loadingLabel?: string;
	/** Y-domain tween duration when transitioning loading ↔ ready (ms). */
	yDomainTweenDuration: number;
	/** Nice’d y-domains per axis from skeleton data (placeholder). */
	yDomainSkeletonByAxis: Record<string, YDomain>;
	/** Nice’d y-domains per axis from the current target data. */
	yDomainTargetByAxis: Record<string, YDomain>;

	isLoaded: boolean;
	animationDuration: number;
	/** CSS easing for clip-reveal / line draw (cartesian charts). */
	animationEasing?: string;
	/** Motion enter transition (spring or tween): drives clip reveal when spring. */
	enterTransition?: Transition;
	/** Increments when enter animation should replay. */
	revealEpoch?: number;
	/** Fired when a one-shot loading pulse (exit / enter) completes. */
	notifyLoadingPulseComplete?: () => void;

	xAccessor: (d: Record<string, unknown>) => Date;

	// Pre-computed date labels for ticker animation
	dateLabels: string[];

	/** Active brush zoom range: when set, axis ticks align to visible data rows. */
	xDomain?: [Date, Date];
	/** Full dataset length when brush zoom is enabled (for zoom vs full-range detection). */
	xDomainSlotCount?: number;

	// Present only in BarChart.
	barScale?: ScaleBand<string>;
	bandWidth?: number;
	barXAccessor?: (d: Record<string, unknown>) => string;
	orientation?: "vertical" | "horizontal";
	stacked?: boolean;
	stackOffsets?: Map<number, Map<string, number>>;
	/** Squares variant: snap tooltip to top square and size ring dots. */
	squareSnap?: { squareGap: number; groupGap?: number; fit?: boolean };

	// ComposedChart + SeriesBar only.
	/** `SeriesBar` dataKeys in tree order, for grouped columns at each x */
	composedBarDataKeys?: string[];
	/** Target bar width in px (Recharts `barSize` style). */
	composedBarSize?: number;
	composedMaxBarSize?: number;
	/** Gap between grouped `SeriesBar` columns in px. */
	composedBarGap?: number;
	/** When true, `SeriesBar` segments stack in child order at each x. */
	composedStacked?: boolean;
	composedStackOffsets?: Map<number, Map<string, number>>;
	/** Vertical gap in px between stacked `SeriesBar` segments. Default: 0 */
	composedStackGap?: number;
}

/** Stable slice of the chart context: data, scales, dimensions, animation state,
 * layout config. Subscribers via `useChartStable()` skip re-renders on hover. */
export type ChartStableContextValue = Omit<
	ChartContextValue,
	keyof ChartHoverContextValue
>;

const ChartStableContext = createContext<ChartStableContextValue | null>(null);
const ChartHoverContext = createContext<ChartHoverContextValue | null>(null);

/** Splits `value` into a stable slice and a volatile hover slice, each memoized on
 * its own fields, so changing `tooltipData` does not bust the stable slice. */
export function ChartProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: ChartContextValue;
}) {
	const stable = useMemo<ChartStableContextValue>(
		() => ({
			data: value.data,
			renderData: value.renderData,
			xScale: value.xScale,
			yScale: value.yScale,
			yScales: value.yScales,
			width: value.width,
			height: value.height,
			innerWidth: value.innerWidth,
			innerHeight: value.innerHeight,
			margin: value.margin,
			columnWidth: value.columnWidth,
			containerRef: value.containerRef,
			lines: value.lines,
			referenceAreas: value.referenceAreas,
			chartPhase: value.chartPhase,
			chartStatus: value.chartStatus,
			loadingLabel: value.loadingLabel,
			yDomainTweenDuration: value.yDomainTweenDuration,
			yDomainSkeletonByAxis: value.yDomainSkeletonByAxis,
			yDomainTargetByAxis: value.yDomainTargetByAxis,
			isLoaded: value.isLoaded,
			animationDuration: value.animationDuration,
			animationEasing: value.animationEasing,
			enterTransition: value.enterTransition,
			revealEpoch: value.revealEpoch,
			notifyLoadingPulseComplete: value.notifyLoadingPulseComplete,
			xAccessor: value.xAccessor,
			dateLabels: value.dateLabels,
			xDomain: value.xDomain,
			xDomainSlotCount: value.xDomainSlotCount,
			barScale: value.barScale,
			bandWidth: value.bandWidth,
			barXAccessor: value.barXAccessor,
			orientation: value.orientation,
			stacked: value.stacked,
			stackOffsets: value.stackOffsets,
			composedBarDataKeys: value.composedBarDataKeys,
			composedBarSize: value.composedBarSize,
			composedMaxBarSize: value.composedMaxBarSize,
			composedBarGap: value.composedBarGap,
			composedStacked: value.composedStacked,
			composedStackOffsets: value.composedStackOffsets,
			composedStackGap: value.composedStackGap,
		}),
		[
			value.data,
			value.renderData,
			value.xScale,
			value.yScale,
			value.yScales,
			value.width,
			value.height,
			value.innerWidth,
			value.innerHeight,
			value.margin,
			value.columnWidth,
			value.containerRef,
			value.lines,
			value.referenceAreas,
			value.chartPhase,
			value.chartStatus,
			value.loadingLabel,
			value.yDomainTweenDuration,
			value.yDomainSkeletonByAxis,
			value.yDomainTargetByAxis,
			value.isLoaded,
			value.animationDuration,
			value.animationEasing,
			value.enterTransition,
			value.revealEpoch,
			value.notifyLoadingPulseComplete,
			value.xAccessor,
			value.dateLabels,
			value.xDomain,
			value.xDomainSlotCount,
			value.barScale,
			value.bandWidth,
			value.barXAccessor,
			value.orientation,
			value.stacked,
			value.stackOffsets,
			value.composedBarDataKeys,
			value.composedBarSize,
			value.composedMaxBarSize,
			value.composedBarGap,
			value.composedStacked,
			value.composedStackOffsets,
			value.composedStackGap,
		],
	);

	const hover = useMemo<ChartHoverContextValue>(
		() => ({
			tooltipData: value.tooltipData,
			setTooltipData: value.setTooltipData,
			selection: value.selection,
			clearSelection: value.clearSelection,
			hoveredBarIndex: value.hoveredBarIndex,
			setHoveredBarIndex: value.setHoveredBarIndex,
			hoveredCandleIndex: value.hoveredCandleIndex,
			setHoveredCandleIndex: value.setHoveredCandleIndex,
		}),
		[
			value.tooltipData,
			value.setTooltipData,
			value.selection,
			value.clearSelection,
			value.hoveredBarIndex,
			value.setHoveredBarIndex,
			value.hoveredCandleIndex,
			value.setHoveredCandleIndex,
		],
	);

	return (
		<ChartStableContext.Provider value={stable}>
			<ChartHoverContext.Provider value={hover}>
				{children}
			</ChartHoverContext.Provider>
		</ChartStableContext.Provider>
	);
}

/** Stable slice: data, scales, dimensions, animation state, layout config. Prefer
 * this in cold consumers like axes, grid, pattern fills; skips re-renders on hover. */
export function useChartStable(): ChartStableContextValue {
	const context = useContext(ChartStableContext);
	if (!context) {
		throw new Error(
			"useChartStable must be used within a ChartProvider. " +
				"Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.",
		);
	}
	return context;
}

/** Y-scale for a series axis (`yAxisId` on Line / Area / YAxis). */
export function useYScale(
	yAxisId?: string | number,
): ScaleLinear<number, number> {
	const { yScales, yScale } = useChartStable();
	const id =
		yAxisId == null || yAxisId === "" ? DEFAULT_Y_AXIS_ID : String(yAxisId);
	return yScales[id] ?? yScale;
}

/** Hover slice: tooltipData, selection, hovered bar / candle indices. Subscribers
 * re-render on every mouse move; use only when the component reads hover state. */
export function useChartHover(): ChartHoverContextValue {
	const context = useContext(ChartHoverContext);
	if (!context) {
		throw new Error(
			"useChartHover must be used within a ChartProvider. " +
				"Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.",
		);
	}
	return context;
}

/** Merged stable + hover context; re-renders on every hover. Prefer
 * `useChartStable()` or `useChartHover()` for hot consumers that need one slice. */
export function useChart(): ChartContextValue {
	const stable = useChartStable();
	const hover = useChartHover();
	// Identity changes per hover: fine here, callers opted in to that re-render.
	return { ...stable, ...hover };
}

export default ChartStableContext;
