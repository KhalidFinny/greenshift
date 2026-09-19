import type { AdminProject } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ShimmerBlock,
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
	/** Data still in flight: same columns, shimmering cards. */
	loading?: boolean;
}

export function KanbanRow({ projects, loading = false }: KanbanRowProps) {
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
					<Button asChild variant="outline" className="">
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
									{/* Stage names are fixed by the lifecycle, so they stay real. */}
									<span className="text-base font-medium">{col.label}</span>
									{loading ? (
										<ShimmerBlock className="h-8 w-12 rounded-md" />
									) : (
										<Badge
											variant="secondary"
											className="!h-8 rounded-md px-3 text-base"
										>
											{col.projects.length}
										</Badge>
									)}
								</div>
								<div className="mt-4 space-y-3">
									{loading
										? Array.from({ length: 2 }, (_, index) => (
												<div
													key={index}
													className="border-b border-border/70 pb-3"
												>
													<ShimmerBlock className="h-5 w-44" />
													<ShimmerBlock className="mt-2 h-5 w-32" />
													<div className="mt-2 flex items-center justify-between">
														<ShimmerBlock className="h-5 w-8" />
														<ShimmerBlock className="size-2 rounded-full" />
													</div>
												</div>
											))
										: col.projects.slice(0, 2).map((project) => (
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
									{!loading && col.projects.length > 2 ? (
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
