import {
	faCheckCircle,
	faInfoCircle,
	faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import type {
	VendorPerformanceMetrics,
	VerificationStatus,
} from "../lib/types";

interface VendorWelcomeCardProps {
	userName: string;
	verificationStatus: VerificationStatus;
	performanceMetrics: VendorPerformanceMetrics;
	completedProjectsCount: number;
}

export function VendorWelcomeCard({
	userName,
	verificationStatus,
	performanceMetrics,
	completedProjectsCount,
}: VendorWelcomeCardProps) {
	const isVerified = verificationStatus === "VERIFIED";

	return (
		<Card className="flex flex-col border-0 bg-[#03442C] text-white lg:col-span-2">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<p className="text-sm font-medium text-emerald-200">
						Green Technology Vendor Workspace
					</p>
					<CardTitle className="mt-1 text-2xl font-bold text-white">
						Welcome, {userName}
					</CardTitle>
				</div>
				<div className="flex size-12 items-center justify-center rounded-full bg-white/15 text-white">
					<FontAwesomeIcon icon={faShieldHalved} className="text-xl" />
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-2">
				<p className="text-sm text-emerald-100/90">
					Manage competitive open biddings, commercial proposal submissions,
					structured contract negotiations, and project milestone execution from
					a unified dashboard.
				</p>

				<div className="grid grid-cols-2 gap-4 rounded-lg bg-white/10 p-4 sm:grid-cols-4">
					<div>
						<p className="text-xs text-emerald-200">Verification Status</p>
						<div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
							<FontAwesomeIcon
								icon={isVerified ? faCheckCircle : faInfoCircle}
								className={isVerified ? "text-emerald-300" : "text-amber-300"}
							/>
							{isVerified ? "Verified" : "Unverified"}
						</div>
					</div>
					<div>
						<p className="text-xs text-emerald-200">Technical Score</p>
						<p className="mt-1 font-semibold text-white">
							{performanceMetrics.technicalPerformanceScore}/100
						</p>
					</div>
					<div>
						<p className="text-xs text-emerald-200">On-Time Rate</p>
						<p className="mt-1 font-semibold text-white">
							{performanceMetrics.onTimeCompletionPercent}%
						</p>
					</div>
					<div>
						<p className="text-xs text-emerald-200">Completed Projects</p>
						<p className="mt-1 font-semibold text-white">
							{completedProjectsCount} Projects
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
