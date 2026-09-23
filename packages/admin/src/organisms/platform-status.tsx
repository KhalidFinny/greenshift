import {
	faCloud,
	faDatabase,
	faHardDrive,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { HealthResponse } from "@greenshift/api/contracts";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";

const CHECKS: Array<{ key: string; label: string; icon: typeof faDatabase }> = [
	{ key: "d1", label: "D1 Database", icon: faDatabase },
	{ key: "kv", label: "KV Namespace", icon: faHardDrive },
	{ key: "r2", label: "R2 Bucket", icon: faCloud },
];

interface PlatformStatusCardProps {
	health: HealthResponse | undefined;
	loading?: boolean;
}

export function PlatformStatusCard({
	health,
	loading = false,
}: PlatformStatusCardProps) {
	const checkedAt = health ? new Date(health.timestamp) : null;

	return (
		<Card>
			<CardHeader className="space-y-2">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Platform Status</CardTitle>
					{loading ? (
						<ShimmerBlock className="h-8 w-28 self-start rounded-md" />
					) : (
						<Badge
							variant={
								health
									? health.status === "ok"
										? "secondary"
										: "destructive"
									: "outline"
							}
							className="!h-8 self-start rounded-md px-3 text-base"
						>
							{health
								? health.status === "ok"
									? "Operational"
									: "Degraded"
								: "Unknown"}
						</Badge>
					)}
				</div>
				<p className="text-base text-muted-foreground">
					Cloudflare bindings probed at load time.
				</p>
			</CardHeader>
			<CardContent className="pt-0">
				{loading ? (
					<ul className="space-y-3">
						{CHECKS.map((check) => (
							<li
								key={check.key}
								className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 text-base last:border-b-0 last:pb-0"
							>
								<span className="flex items-center gap-3">
									<FontAwesomeIcon
										icon={check.icon}
										className="size-4 text-muted-foreground"
									/>
									{check.label}
								</span>
								<ShimmerBlock className="h-5 w-24" />
							</li>
						))}
					</ul>
				) : health ? (
					<>
						<ul className="space-y-3">
							{CHECKS.map((check) => {
								const ok = health.checks[check.key]?.status === "ok";
								return (
									<li
										key={check.key}
										className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 text-base last:border-b-0 last:pb-0"
									>
										<span className="flex items-center gap-3">
											<FontAwesomeIcon
												icon={check.icon}
												className="size-4 text-muted-foreground"
											/>
											{check.label}
										</span>
										<span
											className={
												ok
													? "flex items-center gap-2 text-primary"
													: "flex items-center gap-2 text-destructive"
											}
										>
											<span
												className={
													ok
														? "size-2 rounded-full bg-primary"
														: "size-2 rounded-full bg-destructive"
												}
												aria-hidden="true"
											/>
											{ok ? "Reachable" : "Unreachable"}
										</span>
									</li>
								);
							})}
						</ul>

						<p className="mt-5 text-base text-muted-foreground">
							Last checked{" "}
							<span className="tabular-nums">
								{checkedAt?.toLocaleString("en-GB", {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</span>
						</p>
					</>
				) : (
					<EmptyState
						tone="error"
						title="Health probe did not answer"
						description="The Worker returned nothing for GET /api/health, so the state of D1, KV, and R2 is unknown. Reload the console to probe the bindings again."
					/>
				)}
			</CardContent>
		</Card>
	);
}
