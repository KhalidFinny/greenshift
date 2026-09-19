import type { AdminProject } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

const STATUS_ORDER = [
	"draft",
	"assessment",
	"tendering",
	"blueprint",
	"funding",
	"monitoring",
	"completed",
];

const STATUS_LABELS: Record<string, string> = {
	draft: "Draft",
	assessment: "Assessment",
	tendering: "Tender",
	blueprint: "Blueprint",
	funding: "Funding",
	monitoring: "Monitoring",
	completed: "Completed",
};

interface KanbanRowProps {
	projects: AdminProject[];
}

export function KanbanRow({ projects }: KanbanRowProps) {
	const columns = STATUS_ORDER.map((status) => ({
		status,
		label: STATUS_LABELS[status] ?? status,
		projects: projects.filter((p) => p.status === status),
	}));

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Project Pipeline</CardTitle>
					<Button asChild variant="outline" className="!h-9 px-4 text-base">
						<Link to="/admin/projects">View more</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
					<div className="flex min-w-max gap-8">
						{columns.map((col) => (
							<div key={col.status} className="w-64 shrink-0">
								<div className="flex items-center gap-2">
									<span className="text-base font-medium">{col.label}</span>
									<Badge
										variant="secondary"
										className="!h-8 rounded-md px-3 text-base"
									>
										{col.projects.length}
									</Badge>
								</div>
								<div className="mt-4 space-y-3">
									{col.projects.slice(0, 2).map((project) => (
										<div
											key={project.id}
											className="border-b border-border/70 pb-3"
										>
											<p className="truncate text-base font-medium">
												{project.title}
											</p>
											<p className="mt-1 truncate text-base text-muted-foreground">
												{project.companyName}
											</p>
											<div className="mt-2 flex items-center justify-between text-base">
												<span className="text-muted-foreground">
													{project.riskScore ?? "-"}
												</span>
												{project.blueprintStatus ? (
													<span
														className="size-2 rounded-full bg-primary"
														aria-hidden="true"
													/>
												) : null}
											</div>
										</div>
									))}
									{col.projects.length > 2 ? (
										<p className="text-base text-muted-foreground">
											+{col.projects.length - 2} more
										</p>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
