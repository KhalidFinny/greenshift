import { useEffect, useState, type ReactNode } from "react";
import type { AdminProject } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	ContentSkeleton,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faArrowsRotate,
	faFileLines,
	faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "../lib/format";
import {
	BLUEPRINT_STATUS_BADGE,
	BLUEPRINT_STATUS_LABELS,
	PROJECT_STATUS_BADGE,
	PROJECT_STATUS_LABELS,
	PROJECT_STATUS_OPTIONS,
} from "../lib/project-status";
import { useStepUpAction } from "../lib/use-step-up-action";
import { StepUpDialog } from "./step-up-dialog";

const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

const BLUEPRINT_ACTIONS: Record<
	string,
	Array<{
		label: string;
		next: string;
		variant: "default" | "outline" | "destructive";
	}>
> = {
	draft: [{ label: "Kirim ke Audit", next: "audit", variant: "default" }],
	audit: [
		{ label: "Validasi", next: "validated", variant: "default" },
		{ label: "Tolak", next: "rejected", variant: "destructive" },
	],
	validated: [{ label: "Publikasikan", next: "published", variant: "default" }],
	rejected: [{ label: "Kirim Ulang ke Audit", next: "audit", variant: "outline" }],
	published: [],
};

interface ProjectDetailDialogProps {
	project: AdminProject | null;
	onOpenChange: (open: boolean) => void;
	onMutated: (patch: Partial<AdminProject>) => void;
}

function SectionHeading({
	icon,
	children,
}: {
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<h3 className="flex items-center gap-2 text-base font-semibold">
			<FontAwesomeIcon icon={icon} className="size-4 text-primary" />
			{children}
		</h3>
	);
}

export function ProjectDetailDialog({
	project,
	onOpenChange,
	onMutated,
}: ProjectDetailDialogProps) {
	const open = project !== null;
	const [nextStatus, setNextStatus] = useState<string>(project?.status ?? "draft");
	const [auditNote, setAuditNote] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);

	useEffect(() => {
		if (project) setNextStatus(project.status);
	}, [project]);

	const blueprintsQuery = useQuery({
		queryKey: ["admin", "blueprints"],
		queryFn: () => api.admin.blueprints({ limit: 200 }),
		enabled: open,
	});
	const auditQuery = useQuery({
		queryKey: ["admin", "audit-logs"],
		queryFn: () => api.admin.auditLogs({ limit: 200 }),
		enabled: open,
	});

	const projectStatus = useStepUpAction(
		(id: number, status: string) => api.admin.projectStatus(id, status),
	);
	const blueprintStatus = useStepUpAction(
		(id: number, status: string, note?: string) =>
			api.admin.blueprintStatus(id, status, note),
	);

	if (!project) return null;

	const bp =
		blueprintsQuery.data?.blueprints.find(
			(item) => item.projectId === project.id,
		) ?? null;
	const projectLogs =
		auditQuery.data?.logs
			.filter(
				(log) =>
					(log.entityType === "project" && log.entityId === project.id) ||
					(bp !== null &&
						log.entityType === "blueprint" &&
						log.entityId === bp.id),
			)
			.slice(0, 10) ?? [];

	const runStatusAction = (status: string) => {
		setActionError(null);
		void projectStatus
			.run(project.id, status)
			.then(() => onMutated({ status }))
			.catch((err: unknown) =>
				setActionError(err instanceof Error ? err.message : "Aksi gagal"),
			);
	};

	const runBlueprintAction = (next: string) => {
		if (!bp) return;
		setActionError(null);
		void blueprintStatus
			.run(bp.id, next, auditNote || undefined)
			.then(() => {
				setAuditNote("");
				onMutated({ blueprintStatus: next });
			})
			.catch((err: unknown) =>
				setActionError(err instanceof Error ? err.message : "Aksi gagal"),
			);
	};

	const blueprintActions = BLUEPRINT_ACTIONS[bp?.status ?? ""] ?? [];
	const infoItems = [
		{ label: "Sektor", value: project.industrySector ?? "—" },
		{
			label: "Anggaran",
			value: project.budget ? idr.format(project.budget) : "—",
		},
		{
			label: "Risk Score",
			value: project.riskScore != null ? String(project.riskScore) : "—",
		},
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 space-y-1">
							<DialogTitle className="truncate text-xl font-semibold">
								{project.title}
							</DialogTitle>
							<DialogDescription className="text-base">
								{project.companyName}
							</DialogDescription>
						</div>
						<Badge
							variant={PROJECT_STATUS_BADGE[project.status] ?? "outline"}
							className="shrink-0 !h-8 px-3 text-base"
						>
							{PROJECT_STATUS_LABELS[project.status] ?? project.status}
						</Badge>
					</div>
				</DialogHeader>

				<div className="flex-1 divide-y divide-border overflow-y-auto px-6">
					{actionError && (
						<p className="py-5 text-base text-destructive">{actionError}</p>
					)}

					{blueprintsQuery.isPending || auditQuery.isPending ? (
						<div className="py-5">
							<ContentSkeleton />
						</div>
					) : (
						<>
							<dl className="grid grid-cols-2 gap-x-8 gap-y-5 py-5 sm:grid-cols-3">
								{infoItems.map((item) => (
									<div key={item.label}>
										<dt className="text-base text-muted-foreground">
											{item.label}
										</dt>
										<dd className="mt-1 text-base font-semibold tabular-nums">
											{item.value}
										</dd>
									</div>
								))}
							</dl>

							<section className="space-y-3 py-5">
								<SectionHeading icon={faArrowsRotate}>
									Lifecycle Proyek
								</SectionHeading>
								<div className="flex flex-wrap items-center gap-3">
									<Select
										value={nextStatus}
										onValueChange={(value) => setNextStatus(value)}
									>
										<SelectTrigger className="w-[220px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PROJECT_STATUS_OPTIONS.map((option) => (
												<SelectItem key={option} value={option}>
													{PROJECT_STATUS_LABELS[option]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										onClick={() => runStatusAction(nextStatus)}
										disabled={projectStatus.isPending || nextStatus === project.status}
									>
										Terapkan Status
									</Button>
								</div>
							</section>

							<section className="space-y-3 py-5">
								<div className="flex items-center justify-between gap-3">
									<SectionHeading icon={faFileLines}>
										Green Project Blueprint
									</SectionHeading>
									{bp ? (
										<Badge
											variant={BLUEPRINT_STATUS_BADGE[bp.status] ?? "outline"}
											className="shrink-0 !h-8 px-3 text-base"
										>
											{BLUEPRINT_STATUS_LABELS[bp.status] ?? bp.status}
										</Badge>
									) : null}
								</div>
								{!bp ? (
									<p className="text-base text-muted-foreground">
										Belum ada blueprint untuk proyek ini.
									</p>
								) : (
									<div className="space-y-3">
										{bp.auditNote ? (
											<p className="text-base">
												<span className="font-medium">Catatan audit:</span>{" "}
												{bp.auditNote}
											</p>
										) : null}
										{blueprintActions.length > 0 ? (
											<>
												{bp.status === "audit" ? (
													<textarea
														value={auditNote}
														onChange={(e) => setAuditNote(e.target.value)}
														placeholder="Catatan audit (opsional)"
														className="min-h-24 w-full rounded-sm border border-border bg-background p-3 text-base focus-visible:outline-2 focus-visible:outline-primary"
													/>
												) : null}
												<div className="flex flex-wrap gap-2">
													{blueprintActions.map((action) => (
														<Button
															key={action.next}
															variant={action.variant}
															onClick={() => runBlueprintAction(action.next)}
															disabled={blueprintStatus.isPending}
														>
															{action.label}
														</Button>
													))}
												</div>
											</>
										) : null}
									</div>
								)}
							</section>

							<section className="space-y-3 py-5">
								<SectionHeading icon={faHistory}>Jejak Audit</SectionHeading>
								{projectLogs.length === 0 ? (
									<p className="text-base text-muted-foreground">
										Belum ada aktivitas tercatat.
									</p>
								) : (
									<Table className="text-base">
										<TableHeader>
											<TableRow>
												<TableHead>Waktu</TableHead>
												<TableHead>Aksi</TableHead>
												<TableHead>Pengguna</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{projectLogs.map((log) => (
												<TableRow key={log.id}>
													<TableCell>
														{formatDateTime(log.createdAt)}
													</TableCell>
													<TableCell>
														<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
															{log.action}
														</span>
													</TableCell>
													<TableCell>{log.userEmail ?? "—"}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</section>
						</>
					)}
				</div>

				<DialogFooter className="shrink-0 border-t border-border px-6 py-4">
					<DialogClose asChild>
						<Button variant="outline">Tutup</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>

			<StepUpDialog
				isOpen={projectStatus.stepUpOpen || blueprintStatus.stepUpOpen}
				onClose={() => {
					projectStatus.closeStepUp();
					blueprintStatus.closeStepUp();
				}}
				onSuccess={() => {
					projectStatus.retryAfterStepUp();
					blueprintStatus.retryAfterStepUp();
				}}
			/>
		</Dialog>
	);
}
