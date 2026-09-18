import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { VerificationStatus } from "../lib/types";

interface VerificationBannerProps {
	status: VerificationStatus;
}

export function VerificationBanner({ status }: VerificationBannerProps) {
	if (status === "VERIFIED") return null;

	return (
		<div className="flex items-start justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
			<div className="flex items-start gap-3">
				<FontAwesomeIcon
					icon={faExclamationTriangle}
					className="mt-0.5 text-xl text-amber-600 dark:text-amber-400"
				/>
				<div>
					<h3 className="font-semibold">Company Verification Required</h3>
					<p className="mt-1 text-sm">
						Your vendor account is not yet fully verified. You can browse green
						opportunities and matchmaking scores, but cannot submit bids or proposals until verified.
					</p>
				</div>
			</div>
			<Link to="/vendor/settings">
				<Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
					Complete Verification
				</Button>
			</Link>
		</div>
	);
}
