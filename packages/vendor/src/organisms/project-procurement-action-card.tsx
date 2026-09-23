import {
	faCheckCircle,
	faExclamationTriangle,
	faFileShield,
	faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ShimmerBlock } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { ProcurementMethod } from "../lib/types";

interface ProjectProcurementActionCardProps {
	isVerified: boolean;
	procurementMethod: ProcurementMethod;
	applied?: boolean;
	onOpenProposal: () => void;
	onViewBlueprint: () => void;
	/** Verification / bid state still in flight: same frames, shimmering leaves. */
	loading?: boolean;
}

export function ProjectProcurementActionCard({
	isVerified,
	procurementMethod,
	applied = false,
	onOpenProposal,
	onViewBlueprint,
	loading = false,
}: ProjectProcurementActionCardProps) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-foreground">Actions</h3>

			{loading ? (
				<>
					<ShimmerBlock className="h-11 w-full rounded-lg" />
					<ShimmerBlock className="h-12 w-full rounded-md" />
				</>
			) : !isVerified ? (
				<div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
					<div className="flex items-center gap-2 font-semibold">
						<FontAwesomeIcon
							icon={faExclamationTriangle}
							className="text-amber-700"
						/>
						Verification Required
					</div>
					<p>Complete verification to submit bids or proposals.</p>
					<Link to="/vendor/settings" className="block">
						<Button
							size="sm"
							className="w-full bg-amber-700 text-white hover:bg-amber-700"
						>
							Complete Verification
						</Button>
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					<div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
						<FontAwesomeIcon
							icon={faCheckCircle}
							className="text-emerald-700"
						/>
						<span>Verified for procurement</span>
					</div>

					{applied ? (
						<div className="space-y-2">
							<div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
								<FontAwesomeIcon
									icon={faCheckCircle}
									className="text-emerald-700"
								/>
								<span>You submitted a bid. It is live in rankings.</span>
							</div>
							<Button
								className="w-full gap-2 bg-[#00712D] font-semibold text-white hover:bg-[#00712D]/90"
								onClick={onOpenProposal}
							>
								<FontAwesomeIcon icon={faPaperPlane} />
								Revise Bid
							</Button>
						</div>
					) : (
						<Button
							className="w-full gap-2 bg-[#00712D] font-semibold text-white hover:bg-[#00712D]/90"
							onClick={onOpenProposal}
						>
							<FontAwesomeIcon icon={faPaperPlane} />
							{procurementMethod === "OPEN_BIDDING"
								? "Submit Your Bid"
								: procurementMethod === "CLOSED_BIDDING"
									? "Submit Sealed Proposal"
									: "Respond to Invitation"}
						</Button>
					)}
				</div>
			)}

			{/* The blueprint travels with the tender: readable before a bid exists and while one is drafted. */}
			{loading ? null : (
				<Button
					variant="outline"
					className="w-full gap-2"
					onClick={onViewBlueprint}
				>
					<FontAwesomeIcon icon={faFileShield} aria-hidden />
					View Blueprint
				</Button>
			)}
		</div>
	);
}
