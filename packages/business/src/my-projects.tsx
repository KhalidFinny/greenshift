import {
	faChartLine,
	faCirclePlus,
	faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	demoRiskForStatus,
	downloadProjectSummary,
	MY_PROJECTS,
	type MyProject,
	type MyProjectStatus,
} from "./lib/my-projects";
import { formatId } from "./lib/number-format";
import { RiskAssessmentBody } from "./views/step-4";

function statusPill(status: MyProjectStatus): string {
	switch (status) {
		case "Review LVV":
			return "bg-yellow-100 text-yellow-800";
		case "Matchmaking":
			return "bg-blue-100 text-blue-800";
		case "Verified":
			return "bg-green-100 text-green-800";
	}
}

export function MyProjects() {
	const [riskProject, setRiskProject] = useState<MyProject | null>(null);
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Proyek Saya</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Daftar proyek yang telah Anda ajukan beserta statusnya.
					</p>
				</div>
				<Button asChild>
					<Link to="/business">
						<FontAwesomeIcon icon={faCirclePlus} />
						Ajukan Proyek Baru
					</Link>
				</Button>
			</div>

			<Card>
				<CardContent>
					<Table className="text-base" aria-label="Daftar proyek saya">
						<TableHeader>
							<TableRow>
								<TableHead>Nama Proyek</TableHead>
								<TableHead>Tanggal Pengajuan</TableHead>
								<TableHead>Nilai CAPEX</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{MY_PROJECTS.map((project) => (
								<TableRow key={project.id}>
									<TableCell>
										<p className="font-medium">{project.name}</p>
										<p className="text-muted-foreground">
											{project.location} · {project.sector}
										</p>
									</TableCell>
									<TableCell className="tabular-nums">
										{project.submittedAt}
									</TableCell>
									<TableCell className="tabular-nums">
										{project.capex === null
											? "—"
											: `Rp ${formatId(project.capex)}`}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-0 ${statusPill(project.status)}`}
										>
											{project.status}
										</span>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button type="button" variant="link" asChild>
												<Link to="/business">Detail</Link>
											</Button>
											{/* This triggers isRiskModalOpen-equivalent state: setRiskProject opens the Dialog below with this row's assessment. */}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setRiskProject(project)}
											>
												<FontAwesomeIcon icon={faChartLine} />
												Risk Assessment
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label={`Unduh Dokumen ${project.name}`}
												onClick={() => downloadProjectSummary(project)}
											>
												<FontAwesomeIcon icon={faDownload} />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			<Dialog
				open={riskProject !== null}
				onOpenChange={(open) => {
					if (!open) setRiskProject(null);
				}}
			>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg">
							Penilaian Risiko — {riskProject?.name}
						</DialogTitle>
						<DialogDescription className="text-base">
							Data contoh per status, dihitung via projectRisk().
						</DialogDescription>
					</DialogHeader>
					{riskProject && (
						<RiskAssessmentBody risk={demoRiskForStatus(riskProject.status)} />
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
