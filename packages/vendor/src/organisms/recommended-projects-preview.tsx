import { faLeaf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Button, EmptyState, ShimmerBlock } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "../lib/format";
import type { VendorProjectCardData } from "../lib/types";

interface RecommendedProjectsPreviewProps {
	projects: VendorProjectCardData[];
	/** Data still in flight: same rail, shimmering cards. */
	loading?: boolean;
}

export function RecommendedProjectsPreview({
	projects,
	loading = false,
}: RecommendedProjectsPreviewProps) {
	const displayProjects = projects.slice(0, 6);

	if (!loading && displayProjects.length === 0) {
		return (
			<EmptyState
				icon={<FontAwesomeIcon icon={faLeaf} />}
				title="No recommended tenders yet"
				description="Tenders that match your sector, experience, and price profile appear here once they are published."
				action={
					<Link to="/vendor/opportunities">
						<Button size="sm">Browse Open Tenders</Button>
					</Link>
				}
			/>
		);
	}

	// One rail of card frames; each slot is either a real tender or a shimmer.
	const slots: (VendorProjectCardData | null)[] = loading
		? Array.from({ length: 4 }, () => null)
		: displayProjects;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-foreground">
					Recommended for You
				</h3>
				<Link to="/vendor/opportunities">
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground hover:text-foreground"
					>
						View All
					</Button>
				</Link>
			</div>

			{/* Netflix-style horizontal scroll */}
			<div className="group relative">
				<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
					{slots.map((proj, i) => {
						const frameClass =
							"flex w-[320px] shrink-0 flex-col rounded-xl border border-border bg-card p-5 transition-all";

						const body = (
							<>
								<div className="mb-3 flex items-center justify-between">
									{proj ? (
										<Badge className="bg-emerald-700 text-sm text-white">
											{proj.matchmaking
												? `${proj.matchmaking.overallMatch}% Match`
												: "Not scored"}
										</Badge>
									) : (
										<ShimmerBlock className="h-5 w-24 rounded-md" />
									)}
									{proj ? (
										<span className="text-sm text-muted-foreground">
											{proj.location}
										</span>
									) : (
										<ShimmerBlock className="h-4 w-16" />
									)}
								</div>

								{proj ? (
									<h4 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
										{proj.title}
									</h4>
								) : (
									<ShimmerBlock className="mb-2 h-5 w-4/5" />
								)}

								{proj ? (
									<p className="mb-3 text-sm text-muted-foreground">
										{formatRupiah(proj.estimatedValue)}
									</p>
								) : (
									<ShimmerBlock className="mb-3 h-4 w-28" />
								)}

								<div className="mt-auto rounded-lg bg-muted/50 p-2.5">
									{proj ? (
										<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
											{proj.description ||
												"The company has not published a scope description for this project yet."}
										</p>
									) : (
										<ShimmerBlock className="h-10 w-full" />
									)}
								</div>
							</>
						);

						return proj ? (
							<Link
								key={proj.id}
								to="/vendor/opportunities"
								className={`${frameClass} hover:border-border/80 hover:shadow-md`}
							>
								{body}
							</Link>
						) : (
							<div key={i} className={frameClass}>
								{body}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
