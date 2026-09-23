import {
	faCircle,
	faEraser,
	faHighlighter,
	faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button } from "../atoms/button";
import { cn } from "../lib/utils";

/** A mark drawn on a proposal: coordinates are fractions of the page, never
 * pixels, so a mark drawn on one screen reads the same on the other. */
export type ProposalMarkKind = "highlight" | "circle";

export interface ProposalAnnotation {
	id: string;
	kind: ProposalMarkKind;
	x: number;
	y: number;
	w: number;
	h: number;
}

/** What the reader is holding: one of the two marks, or the eraser. */
type MarkTool = ProposalMarkKind | "erase";

/** The document both sides read: deliberately not the API's shape, so each
 * surface maps its own bid onto it and the page renders identically everywhere. */
export interface ProposalDocumentData {
	/** What the work is, so the page names the thing being bid on. */
	title: string;
	vendorName: string;
	/** ISO date the bid was submitted, or null. */
	submittedAt: string | null;
	amount: number;
	operationalCost: number | null;
	projectedRoi: number | null;
	/** Months of warranty offered. */
	warrantyPeriod: number | null;
	technicalSpec: string | null;
	revisionCount: number;
}

/** Fixed width on purpose: marks are fractions of this box, so a reflowing page
 * would put a mark on a different line for the other side. Narrow screens scroll. */
const PAGE_WIDTH = 720;

/** What the reader can hold, in the order the toolbar offers them. */
const TOOLS: Array<{ id: MarkTool; label: string; icon: typeof faCircle }> = [
	{ id: "highlight", label: "Highlight", icon: faHighlighter },
	{ id: "circle", label: "Circle", icon: faCircle },
	{ id: "erase", label: "Erase", icon: faEraser },
];

const rupiah = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

function money(value: number | null): string {
	return value === null ? "Not stated" : rupiah.format(value);
}

function submitted(value: string | null): string {
	if (!value) return "Not dated";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Not dated"
		: date.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
}

/** One figure of the bid, as a row of the document's own table. */
function FigureRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-2.5">
			<dt className="text-sm text-neutral-500">{label}</dt>
			<dd className="text-right text-sm font-semibold tabular-nums text-neutral-900">
				{value}
			</dd>
		</div>
	);
}

/** The marks over the page, plus the pointer layer when the reader may draw; the
 * page underneath never moves, so a mark lands where it was drawn. */
function MarkLayer({
	marks,
	pending,
	tool,
	editable,
	onDraw,
	onErase,
}: {
	marks: ProposalAnnotation[];
	pending: ProposalAnnotation | null;
	tool: MarkTool;
	editable: boolean;
	onDraw: (start: { x: number; y: number }) => void;
	onErase: (id: string) => void;
}) {
	return (
		<div
			className={cn(
				"absolute inset-0",
				editable
					? tool === "erase"
						? "cursor-pointer"
						: "cursor-crosshair"
					: "pointer-events-none",
			)}
			onPointerDown={(event) => {
				// The eraser's own guard lives in the tool, so no box starts while it is held.
				if (!editable) return;
				event.currentTarget.setPointerCapture(event.pointerId);
				const box = event.currentTarget.getBoundingClientRect();
				onDraw({
					x: (event.clientX - box.left) / box.width,
					y: (event.clientY - box.top) / box.height,
				});
			}}
		>
			{[...marks, ...(pending ? [pending] : [])].map((mark, index) => {
				const drawn = index === marks.length;
				const style = {
					left: `${mark.x * 100}%`,
					top: `${mark.y * 100}%`,
					width: `${mark.w * 100}%`,
					height: `${mark.h * 100}%`,
				};
				const className = cn(
					"absolute",
					mark.kind === "highlight"
						? "border border-amber-500/70 bg-amber-300/40"
						: "rounded-[50%] border-2 border-rose-600",
					drawn && "border-dashed",
					editable && tool === "erase" && "pointer-events-auto cursor-pointer",
				);
				return editable && tool === "erase" && !drawn ? (
					<button
						key={mark.id}
						type="button"
						style={style}
						className={className}
						aria-label="Remove this mark"
						onPointerDown={(event) => {
							event.stopPropagation();
							onErase(mark.id);
						}}
					/>
				) : (
					<span key={mark.id} style={style} className={className} />
				);
			})}
		</div>
	);
}

/** One vendor's proposal. Read-only when `onMarksChange` is absent (the vendor's
 * copy); marks are handed back in the page's own fractions, so callers store them. */
export function AnnotatedProposal({
	proposal,
	marks,
	onMarksChange,
}: {
	proposal: ProposalDocumentData;
	marks: ProposalAnnotation[];
	onMarksChange?: (marks: ProposalAnnotation[]) => void;
}) {
	const [tool, setTool] = useState<MarkTool>("highlight");
	const [pending, setPending] = useState<{
		kind: ProposalMarkKind;
		start: { x: number; y: number };
		current: { x: number; y: number };
	} | null>(null);

	const editable = onMarksChange !== undefined;

	function beginDraw(start: { x: number; y: number }) {
		// The eraser never starts a box: it takes marks back instead.
		if (tool === "erase") return;
		setPending({ kind: tool, start, current: start });
	}

	function extendDraw(event: React.PointerEvent<HTMLDivElement>) {
		if (!pending) return;
		const box = event.currentTarget.getBoundingClientRect();
		setPending({
			kind: pending.kind,
			start: pending.start,
			current: {
				x: (event.clientX - box.left) / box.width,
				y: (event.clientY - box.top) / box.height,
			},
		});
	}

	/** The box the two corners describe, clamped to the page. */
	function boxOf(drag: {
		start: { x: number; y: number };
		current: { x: number; y: number };
	}) {
		const clamp = (value: number) => Math.min(1, Math.max(0, value));
		const left = clamp(Math.min(drag.start.x, drag.current.x));
		const top = clamp(Math.min(drag.start.y, drag.current.y));
		const right = clamp(Math.max(drag.start.x, drag.current.x));
		const bottom = clamp(Math.max(drag.start.y, drag.current.y));
		return { x: left, y: top, w: right - left, h: bottom - top };
	}

	function endDraw() {
		if (!pending || !onMarksChange) return;
		const { kind, ...drag } = pending;
		const box = boxOf(drag);
		setPending(null);
		// A tap is not a mark: a stray dot would read as a note they did not make.
		if (box.w < 0.02 || box.h < 0.01) return;
		onMarksChange([...marks, { id: crypto.randomUUID(), kind, ...box }]);
	}

	const draft: ProposalAnnotation | null = pending
		? { id: "draft", kind: pending.kind, ...boxOf(pending) }
		: null;

	return (
		<div className="space-y-3">
			{editable ? (
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-1.5">
						{TOOLS.map((option) => (
							<Button
								key={option.id}
								type="button"
								size="sm"
								variant={tool === option.id ? "default" : "outline"}
								aria-pressed={tool === option.id}
								onClick={() => setTool(option.id)}
							>
								<FontAwesomeIcon icon={option.icon} aria-hidden />
								{option.label}
							</Button>
						))}
					</div>
					<div className="flex items-center gap-2">
						<p className="text-sm text-muted-foreground">
							{marks.length === 0
								? "No marks yet"
								: `${marks.length} mark${marks.length === 1 ? "" : "s"}`}
						</p>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={marks.length === 0}
							onClick={() => onMarksChange([])}
						>
							<FontAwesomeIcon icon={faTrashCan} aria-hidden />
							Clear
						</Button>
					</div>
				</div>
			) : null}

			<div className="overflow-x-auto rounded-xl border border-border bg-neutral-100 p-4">
				<div
					className="relative mx-auto bg-white shadow-sm"
					style={{ width: PAGE_WIDTH }}
					onPointerMove={extendDraw}
					onPointerUp={endDraw}
					onPointerCancel={() => setPending(null)}
				>
					<article className="px-12 py-10">
						<header className="border-b border-neutral-300 pb-5">
							<p className="text-sm uppercase tracking-widest text-neutral-500">
								Vendor proposal
							</p>
							<h3 className="mt-2 text-xl font-semibold text-neutral-900">
								{proposal.title}
							</h3>
							<p className="mt-1.5 text-sm text-neutral-600">
								Submitted by {proposal.vendorName} ·{" "}
								{submitted(proposal.submittedAt)}
								{proposal.revisionCount > 0
									? ` · revision ${proposal.revisionCount}`
									: ""}
							</p>
						</header>

						<dl className="mt-6">
							<FigureRow label="Bid amount" value={money(proposal.amount)} />
							<FigureRow
								label="Operating cost"
								value={money(proposal.operationalCost)}
							/>
							<FigureRow
								label="Projected ROI"
								value={
									proposal.projectedRoi === null
										? "Not stated"
										: `${proposal.projectedRoi}%`
								}
							/>
							<FigureRow
								label="Warranty"
								value={
									proposal.warrantyPeriod === null
										? "Not stated"
										: `${proposal.warrantyPeriod} months`
								}
							/>
						</dl>

						<section className="mt-8">
							<h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
								Technical scope
							</h4>
							<p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-800">
								{proposal.technicalSpec?.trim() ||
									"The vendor did not write a technical scope on this bid."}
							</p>
						</section>
					</article>

					<MarkLayer
						marks={marks}
						pending={draft}
						tool={tool}
						editable={editable}
						onDraw={beginDraw}
						onErase={(id) =>
							onMarksChange?.(marks.filter((mark) => mark.id !== id))
						}
					/>
				</div>
			</div>
		</div>
	);
}
