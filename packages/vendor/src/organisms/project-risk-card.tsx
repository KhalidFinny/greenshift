import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";

export function ProjectRiskCard() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faShieldAlt} className="text-emerald-600" />
					Project Risk Assessment
				</CardTitle>
				<Badge
					variant="outline"
					className="border-amber-500 text-amber-700 dark:text-amber-300"
				>
					Overall Risk: Medium
				</Badge>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<p className="text-muted-foreground">
					This risk assessment is automatically computed from engineering models
					and blueprint financial metrics. Vendors cannot alter baseline risk
					parameters.
				</p>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-lg border border-border p-3">
						<p className="text-muted-foreground">Financial Risk</p>
						<p className="mt-1 font-bold text-emerald-600">Low</p>
					</div>
					<div className="rounded-lg border border-border p-3">
						<p className="text-muted-foreground">Technical Risk</p>
						<p className="mt-1 font-bold text-amber-600">Medium</p>
					</div>
					<div className="rounded-lg border border-border p-3">
						<p className="text-muted-foreground">Implementation Risk</p>
						<p className="mt-1 font-bold text-amber-600">Medium</p>
					</div>
					<div className="rounded-lg border border-border p-3">
						<p className="text-muted-foreground">Operational Risk</p>
						<p className="mt-1 font-bold text-emerald-600">Low</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
