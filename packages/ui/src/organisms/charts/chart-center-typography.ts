export const chartCenterContainerClassName =
	"@container/chart-center size-full min-w-0";

/** Primary stat: ~22% of center width, never under the 14px body floor. */
export const chartCenterValueClassName =
	"font-bold tabular-nums leading-none text-[clamp(0.875rem,22cqw,1.875rem)]";

/** Supporting label: ~9% of center width, never under the 14px body floor. */
export const chartCenterLabelClassName =
	"max-w-full truncate leading-tight text-[clamp(0.875rem,9cqw,1rem)]";
