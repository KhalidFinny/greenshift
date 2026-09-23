/* The order a vendor works in, each step pointing at the surface that carries it; the banner above already reports verification state, so the card claims none. */

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

const STEPS = [
	{
		text: "Complete the profile, add NIB, NPWP and TDP, file the certificate, then an administrator verifies the pack.",
		action: "Open settings",
		to: "/vendor/settings",
	},
	{
		text: "Browse open tenders and file a bid with the proposal PDF.",
		action: "Browse tenders",
		to: "/vendor/opportunities",
	},
	{
		text: "Answer a revision request when a client opens a negotiation round.",
		action: "Answer a revision",
		to: "/vendor/deals",
	},
	{
		text: "Deliver against the milestones of an awarded project.",
		action: "Track delivery",
		to: "/vendor/deals",
	},
] as const;

export function GettingStartedCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Getting started</CardTitle>
				<CardDescription>How a vendor starts here, in order.</CardDescription>
			</CardHeader>
			<CardContent>
				<ol className="divide-y divide-border">
					{STEPS.map((step, index) => (
						<li
							key={step.action}
							className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
						>
							<div className="flex min-w-0 gap-3">
								<span className="text-sm font-semibold tabular-nums text-muted-foreground">
									{index + 1}
								</span>
								<p className="text-sm leading-6">{step.text}</p>
							</div>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="w-full shrink-0 sm:w-auto"
							>
								<Link to={step.to}>{step.action}</Link>
							</Button>
						</li>
					))}
				</ol>
			</CardContent>
		</Card>
	);
}
