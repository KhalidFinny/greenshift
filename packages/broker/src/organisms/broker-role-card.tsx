import { faFileContract } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";

/** The one paragraph a broker should read before the numbers: who they are on this platform. */
export function BrokerRoleCard() {
	return (
		<Card className="border-0 bg-[#03442C] text-white">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<p className="text-sm font-medium text-emerald-200">
						Securities Firm Workspace
					</p>
					<CardTitle className="mt-1 text-2xl font-bold text-white">
						What a broker is on GreenShift
					</CardTitle>
				</div>
				<div className="flex size-12 items-center justify-center rounded-full bg-white/15 text-white">
					<FontAwesomeIcon icon={faFileContract} className="text-xl" />
				</div>
			</CardHeader>
			<CardContent className="pt-2">
				<p className="text-sm leading-relaxed text-emerald-100/90">
					A broker here is a licensed securities firm — the OJK-licensed partner
					that takes a project GreenShift has already verified and prepares it
					for issuance. The bond is issued, sold and held outside the platform,
					in the securities partner app; GreenShift settles nothing and tracks
					the preparation and the monitoring. A broker is not a bank, not a
					fund, and not a marketplace.
				</p>
			</CardContent>
		</Card>
	);
}
