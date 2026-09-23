"use client";

import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { Line, LinePath } from "@visx/shape";
import { type ReactElement, useMemo } from "react";
import { niceYDomain } from "./y-domain-utils";

export interface LineSeries {
	key: string;
	label: string;
	/** One value per x label; null leaves a gap in the line. */
	values: Array<number | null>;
	color: string;
	/** Dashed line, for a projection rather than a measurement. Default false. */
	dashed?: boolean;
}

export interface LineChartProps {
	labels: string[];
	series: LineSeries[];
	reference?: { value: number; label: string };
	formatValue: (value: number) => string;
	height?: number;
	ariaLabel: string;
}

const DEFAULT_HEIGHT = 280;
const Y_TICKS = 5;
/** Beyond this many points the x labels thin out to every other one. */
const DENSE_LABEL_COUNT = 12;

const GRID_STROKE = "var(--chart-grid, var(--border))";
const ZERO_STROKE = "var(--border)";
const REFERENCE_STROKE = "var(--muted-foreground)";
const LABEL_FILL = "var(--chart-label, var(--muted-foreground))";
const LINE_WIDTH = 2;
const DASH_ARRAY = "6 4";

const TOP_MARGIN = 16;
const RIGHT_MARGIN = 16;
const BOTTOM_MARGIN = 26;
const X_LABEL_GAP = 18;
/** Reference label sits above its line, or below it when the line is near the top edge. */
const REFERENCE_LABEL_GAP = 6;
const REFERENCE_LABEL_DROP = 14;
/** Average advance of one `text-sm` (14px) digit, used to reserve the y-label gutter. */
const LABEL_CHAR_PX = 7.8;
/** Gap between a y label and the plot, plus slack for a label that runs wider than estimated. */
const GUTTER_PADDING = 14;
const MIN_GUTTER = 56;
const MAX_GUTTER = 168;

/** Every finite value the domain has to hold: the series points plus the reference. */
function collectValues(
	series: LineSeries[],
	reference?: { value: number },
): number[] {
	const values: number[] = [];
	for (const line of series) {
		for (const value of line.values) {
			if (value != null && Number.isFinite(value)) {
				values.push(value);
			}
		}
	}
	if (reference && Number.isFinite(reference.value)) {
		values.push(reference.value);
	}
	return values;
}

function resolveYDomain(values: number[]): [number, number] {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const value of values) {
		if (value < min) {
			min = value;
		}
		if (value > max) {
			max = value;
		}
	}
	if (min > max) {
		return [0, 1];
	}
	// A flat series has no span to scale: give it room instead of a degenerate axis.
	if (min === max) {
		const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
		return niceYDomain([min - padding, max + padding]);
	}
	return niceYDomain([min, max]);
}

function resolveGutter(tickLabels: string[]): number {
	let longest = 0;
	for (const label of tickLabels) {
		if (label.length > longest) {
			longest = label.length;
		}
	}
	return Math.min(
		Math.max(longest * LABEL_CHAR_PX + GUTTER_PADDING, MIN_GUTTER),
		MAX_GUTTER,
	);
}

interface LineChartInnerProps {
	width: number;
	height: number;
	labels: string[];
	series: LineSeries[];
	reference?: { value: number; label: string };
	formatValue: (value: number) => string;
	ariaLabel: string;
}

function LineChartInner({
	width,
	height,
	labels,
	series,
	reference,
	formatValue,
	ariaLabel,
}: LineChartInnerProps): ReactElement {
	const domain = useMemo(
		() => resolveYDomain(collectValues(series, reference)),
		[series, reference],
	);

	const tickValues = useMemo(
		() => scaleLinear({ domain }).ticks(Y_TICKS),
		[domain],
	);

	const gutter = useMemo(
		() => resolveGutter(tickValues.map(formatValue)),
		[tickValues, formatValue],
	);

	const innerWidth = Math.max(width - gutter - RIGHT_MARGIN, 0);
	const innerHeight = Math.max(height - TOP_MARGIN - BOTTOM_MARGIN, 0);

	const yScale = useMemo(
		() => scaleLinear({ domain, range: [innerHeight, 0] }),
		[domain, innerHeight],
	);
	const xScale = useMemo(
		() =>
			scalePoint<string>({
				domain: labels,
				range: [0, innerWidth],
				padding: 0.5,
			}),
		[labels, innerWidth],
	);

	const zeroValue = domain[0] <= 0 && domain[1] >= 0 ? yScale(0) : null;
	const skipLabels = labels.length > DENSE_LABEL_COUNT;
	const referenceY = reference ? yScale(reference.value) : null;

	return (
		<svg
			aria-label={ariaLabel}
			className="block w-full"
			height={height}
			role="img"
			width={width}
		>
			<g transform={`translate(${gutter}, ${TOP_MARGIN})`}>
				{tickValues.map((value) => {
					const y = yScale(value);
					return (
						<g key={value}>
							{zeroValue === null || value !== 0 ? (
								<Line
									from={{ x: 0, y }}
									stroke={GRID_STROKE}
									strokeWidth={1}
									to={{ x: innerWidth, y }}
								/>
							) : null}
							<text
								className="text-sm"
								dominantBaseline="middle"
								fill={LABEL_FILL}
								textAnchor="end"
								x={-10}
								y={y}
							>
								{formatValue(value)}
							</text>
						</g>
					);
				})}

				{zeroValue === null ? null : (
					<Line
						from={{ x: 0, y: zeroValue }}
						stroke={ZERO_STROKE}
						strokeWidth={1}
						to={{ x: innerWidth, y: zeroValue }}
					/>
				)}

				{reference && referenceY !== null ? (
					<g>
						<Line
							from={{ x: 0, y: referenceY }}
							stroke={REFERENCE_STROKE}
							strokeDasharray="4 4"
							strokeWidth={1}
							to={{ x: innerWidth, y: referenceY }}
						/>
						<text
							className="text-sm"
							fill={LABEL_FILL}
							textAnchor="end"
							x={innerWidth}
							y={
								referenceY - REFERENCE_LABEL_GAP > 0
									? referenceY - REFERENCE_LABEL_GAP
									: referenceY + REFERENCE_LABEL_DROP
							}
						>
							{`${reference.label} · ${formatValue(reference.value)}`}
						</text>
					</g>
				) : null}

				{series.map((line) => (
					<LinePath<number | null>
						data={line.values}
						defined={(value, index) =>
							value != null && Number.isFinite(value) && labels[index] != null
						}
						key={line.key}
						stroke={line.color}
						strokeDasharray={line.dashed ? DASH_ARRAY : undefined}
						strokeLinecap="round"
						strokeWidth={LINE_WIDTH}
						x={(_, index) => xScale(labels[index]) ?? 0}
						y={(value) => yScale(value ?? 0)}
					/>
				))}

				{labels.map((label, index) => {
					if (skipLabels && index % 2 !== 0) {
						return null;
					}
					const x = xScale(label);
					if (x == null) {
						return null;
					}
					return (
						<text
							className="text-sm"
							fill={LABEL_FILL}
							key={`${label}-${index}`}
							textAnchor="middle"
							x={x}
							y={innerHeight + X_LABEL_GAP}
						>
							{label}
						</text>
					);
				})}
			</g>
		</svg>
	);
}

export function LineChart({
	labels,
	series,
	reference,
	formatValue,
	height = DEFAULT_HEIGHT,
	ariaLabel,
}: LineChartProps): ReactElement {
	const hasPlottableData =
		labels.length >= 2 &&
		series.some((line) =>
			line.values.some((value) => value != null && Number.isFinite(value)),
		);

	if (!hasPlottableData) {
		return (
			<div
				className="flex w-full items-center justify-center"
				style={{ height }}
			>
				<p className="text-sm text-muted-foreground">
					Not enough data to draw a chart.
				</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
				{series.map((line) => (
					<span
						className="flex items-center gap-2 text-sm text-muted-foreground"
						key={line.key}
					>
						<span
							aria-hidden="true"
							className="w-4 border-t-2"
							style={{
								borderColor: line.color,
								borderStyle: line.dashed ? "dashed" : "solid",
							}}
						/>
						{line.label}
					</span>
				))}
			</div>
			<div style={{ height }}>
				<ParentSize debounceTime={10}>
					{({ width }) =>
						width > 0 ? (
							<LineChartInner
								ariaLabel={ariaLabel}
								formatValue={formatValue}
								height={height}
								labels={labels}
								reference={reference}
								series={series}
								width={width}
							/>
						) : null
					}
				</ParentSize>
			</div>
		</div>
	);
}

LineChart.displayName = "LineChart";

export default LineChart;
