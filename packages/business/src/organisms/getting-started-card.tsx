/* The order a company works in, each step pointing at the surface that carries it; the dashboard holds no verification status, so the card claims none. */

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
		text: "Confirm the company's details, add its NIB and NPWP, file the deed of incorporation and the trading licence, then submit the pack.",
		action: "Verify the company",
		to: "/business/verification",
	},
	{
		text: "Submit a project through the wizard, from its profile to the review and the ROI forecast.",
		action: "Submit a project",
		to: "/business/submit",
	},
	{
		text: "Match vendors on the model's ranking, open the tender and award the winning bid.",
		action: "Open matchmaking",
		to: "/business/matchmaking",
	},
	{
		text: "Follow the project's record as it moves through funding and monitoring.",
		action: "View projects",
		to: "/business/projects",
	},
] as const;

export function GettingStartedCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Getting started</CardTitle>
				<CardDescription>How a company starts here, in order.</CardDescription>
			</CardHeader>
			<CardContent>
				<ol className="divide-y divide-border">
					{STEPS.map((step, index) => (
						<li
							key={step.to}
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
