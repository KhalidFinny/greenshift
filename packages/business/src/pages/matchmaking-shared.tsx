import {
	faBuilding,
	faCalendarDays,
	faMapPin,
	faScaleBalanced,
	faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
	BusinessMatchFactor,
	BusinessMatchmakingDetail,
	BusinessRecommendedVendor,
	BusinessTender,
} from "@greenshift/core";
import { Card, CardContent, cn } from "@greenshift/ui";
import { formatRupiah, formatSubmittedAt } from "../lib/project-display";

export const DEFAULT_TENDER_DAYS = 14;

const pad = (value: number) => String(value).padStart(2, "0");

/** A `datetime-local` value: local time, no zone, which is what the input wants. */
export function toLocalInput(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultDeadline(): string {
	return toLocalInput(
		new Date(Date.now() + DEFAULT_TENDER_DAYS * 24 * 60 * 60 * 1000),
	);
}

export function timeLeftLabel(deadlineAt: string | null): string {
	if (!deadlineAt) return "open-ended";
	const diff = new Date(deadlineAt).getTime() - Date.now();
	if (diff <= 0) return "passed";
	const hours = Math.floor(diff / (60 * 60 * 1000));
	if (hours < 1) return `${Math.max(1, Math.floor(diff / 60000))} minutes`;
	if (hours < 48) return `${hours} hours`;
	return `${Math.floor(hours / 24)} days`;
}

export function deadlinePhrase(deadlineAt: string | null): string {
	const left = timeLeftLabel(deadlineAt);
	return left === "passed" ? "the deadline has passed" : `${left} left`;
}

export const TENDER_STATUS_LABEL: Record<string, string> = {
	open: "Bidding open",
	evaluation: "Under evaluation",
	closed: "Closed",
	awarded: "Awarded",
};

export const TENDER_STATUS_PILL: Record<string, string> = {
	open: "bg-blue-50 text-blue-700",
	evaluation: "bg-amber-50 text-amber-700",
	closed: "bg-muted text-muted-foreground",
	awarded: "bg-emerald-50 text-emerald-700",
};

export const STAGES = ["Route", "Bidding", "Evaluation", "Awarded"] as const;

export function stageIndex(
	selectedVendorId: number | null,
	tender: BusinessTender | null,
): number {
	if (tender === null) return selectedVendorId === null ? 0 : 1;
	if (tender.status === "open") return 1;
	if (tender.status === "evaluation") return 2;
	return 3;
}

export function stageSummary(
	tender: BusinessTender | null,
	vendorName: string | null,
): string {
	if (tender === null) {
		return vendorName
			? `${vendorName} is named on the direct route. Opening the tender starts the bidding window.`
			: "Choose the route, then open the tender to start the bidding window.";
	}
	if (tender.status === "open") {
		return tender.bidCount === 0
			? `Waiting on bids, ${deadlinePhrase(tender.deadlineAt)}.`
			: `${tender.bidCount} bid${tender.bidCount === 1 ? "" : "s"} in, ${deadlinePhrase(tender.deadlineAt)}.`;
	}
	if (tender.status === "evaluation") {
		return tender.bidCount === 0
			? "Bidding closed with no bids on this tender."
			: `${tender.bidCount} bid${tender.bidCount === 1 ? "" : "s"} to read.`;
	}
	return tender.awardedVendorName
		? `Awarded to ${tender.awardedVendorName}.`
		: "This tender is closed.";
}

export function ProjectFacts({
	detail,
}: {
	detail: BusinessMatchmakingDetail;
}) {
	const { project } = detail;
	return (
		<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
			{[
				{
					icon: faWallet,
					label: "CAPEX",
					value: formatRupiah(project.capexRp),
				},
				{
					icon: faMapPin,
					label: "Location",
					value: project.location ?? "Not filled in",
				},
				{
					icon: faBuilding,
					label: "Sector",
					value: project.sector ?? "Not filled in",
				},
				{
					icon: faCalendarDays,
					label: "Submitted",
					value: formatSubmittedAt(project.submittedAt),
				},
			].map((fact) => (
				<span key={fact.label} className="flex items-center gap-2">
					<FontAwesomeIcon
						icon={fact.icon}
						className="size-4 shrink-0 text-muted-foreground"
						aria-hidden
					/>
					<span className="text-sm text-muted-foreground">{fact.label}</span>
					<span className="text-sm font-medium tabular-nums">{fact.value}</span>
				</span>
			))}
		</div>
	);
}

export function StageBand({
	index,
	summary,
	tender,
	children,
}: {
	index: number;
	summary: string;
	tender: BusinessTender | null;
	children?: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-border bg-card px-5 py-4">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
				{STAGES.map((stage, i) => (
					<span key={stage} className="flex items-center gap-3">
						<span
							className={cn(
								"flex items-center gap-2 text-sm",
								i === index
									? "font-semibold text-foreground"
									: "text-muted-foreground",
							)}
						>
							<span
								aria-hidden
								className={cn(
									"flex size-5 items-center justify-center rounded-full text-sm font-semibold",
									i < index
										? "bg-primary/10 text-primary"
										: i === index
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground",
								)}
							>
								{i < index ? "✓" : i + 1}
							</span>
							{stage}
						</span>
						{i < STAGES.length - 1 && (
							<span aria-hidden className="h-px w-6 bg-border sm:w-10" />
						)}
					</span>
				))}
				{tender && (
					<span
						className={cn(
							"ml-auto rounded-md px-2.5 py-1 text-sm font-medium",
							TENDER_STATUS_PILL[tender.status] ?? "bg-muted",
						)}
					>
						{TENDER_STATUS_LABEL[tender.status] ?? tender.status}
					</span>
				)}
			</div>
			<p className="mt-3 text-sm leading-6">{summary}</p>
			{children}
		</div>
	);
}

export function CriteriaPanel({ factors }: { factors: BusinessMatchFactor[] }) {
	return (
		<dl className="space-y-3">
			{factors.map((factor) => (
				<div key={factor.label} className="space-y-1.5">
					<div className="flex items-baseline justify-between gap-3">
						<dt className="text-sm font-medium">
							{factor.label}
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								{factor.applied
									? `${factor.weight}% of the score`
									: "left out of this score"}
							</span>
						</dt>
						<dd className="shrink-0 text-sm font-semibold tabular-nums">
							{factor.pct}% pool
						</dd>
					</div>
					<div
						role="img"
						aria-label={`${factor.label}: this project's vendors average ${factor.pct} of 100`}
						className="h-1.5 rounded-full bg-muted"
					>
						<div
							className={cn(
								"h-1.5 rounded-full",
								factor.applied ? "bg-primary" : "bg-muted-foreground/40",
							)}
							style={{ width: `${factor.pct}%` }}
						/>
					</div>
				</div>
			))}
		</dl>
	);
}

export function ModelCard({
	factors,
	children,
}: {
	factors: BusinessMatchFactor[];
	children?: React.ReactNode;
}) {
	return (
		<Card>
			<CardContent className="space-y-4">
				<p className="flex items-center gap-2 text-sm font-semibold">
					<FontAwesomeIcon
						icon={faScaleBalanced}
						className="size-4 text-muted-foreground"
						aria-hidden
					/>
					How the match score is weighted
				</p>
				<CriteriaPanel factors={factors} />
				{children}
			</CardContent>
		</Card>
	);
}

export function VendorCriteria({
	vendor,
}: {
	vendor: BusinessRecommendedVendor;
}) {
	return (
		<dl className="space-y-2">
			{vendor.criteria.map((criterion) => (
				<div key={criterion.label} className="space-y-1">
					<div className="flex items-baseline justify-between gap-3">
						<dt className="text-sm text-muted-foreground">{criterion.label}</dt>
						<dd className="shrink-0 text-sm font-semibold tabular-nums">
							{criterion.pct}
						</dd>
					</div>
					<div className="h-1.5 rounded-full bg-muted">
						<div
							className="h-1.5 rounded-full bg-primary"
							style={{ width: `${criterion.pct}%` }}
						/>
					</div>
				</div>
			))}
		</dl>
	);
}

export function VendorRecord({
	vendor,
}: {
	vendor: BusinessRecommendedVendor;
}) {
	return (
		<dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
			{[
				{ label: "Match score", value: `${vendor.score}` },
				{ label: "Rank", value: `#${vendor.rank}` },
				{ label: "Rated", value: vendor.rating.toFixed(1) },
				{ label: "Delivered", value: `${vendor.totalProjects} projects` },
				{ label: "Verified", value: vendor.verified ? "Yes" : "No" },
				{ label: "Scope", value: vendor.subtitle },
			].map((row) => (
				<div
					key={row.label}
					className="flex items-baseline justify-between gap-4"
				>
					<dt className="shrink-0 text-sm text-muted-foreground">
						{row.label}
					</dt>
					<dd className="min-w-0 truncate text-right text-sm font-medium">
						{row.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
