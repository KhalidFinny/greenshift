import {
	faCircleCheck,
	faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { MATCHMAKING_PROJECTS } from "./lib/matchmaking";
import { formatId } from "./lib/number-format";

export function MatchmakingList() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Vendor Matchmaking</h1>
				<p className="mt-1 text-base text-muted-foreground">
					Temukan vendor yang paling sesuai untuk setiap proyek Anda.
				</p>
			</div>

			<Card>
				<CardContent>
					<Table
						className="text-base"
						aria-label="Daftar proyek untuk matchmaking"
					>
						<TableHeader>
							<TableRow>
								<TableHead>Nama Proyek</TableHead>
								<TableHead>Tanggal Pengajuan</TableHead>
								<TableHead>Nilai CAPEX</TableHead>
								<TableHead>Vendor Terpilih</TableHead>
								<TableHead>Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{MATCHMAKING_PROJECTS.map((project) => (
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
										{project.selectedVendor === null ? (
											<span className="text-muted-foreground">Belum ada</span>
										) : (
											<span className="flex items-center gap-2">
												{project.selectedVendor}
												<FontAwesomeIcon
													icon={faCircleCheck}
													className="text-primary"
													aria-label="Vendor terpilih"
												/>
											</span>
										)}
									</TableCell>
									<TableCell>
										{project.selectedVendor === null ? (
											<Button asChild>
												<Link
													to="/business/matchmaking/$projectId"
													params={{ projectId: project.id }}
												>
													<FontAwesomeIcon icon={faMagnifyingGlass} />
													Cari Vendor
												</Link>
											</Button>
										) : (
											<Button variant="outline" asChild>
												<Link
													to="/business/matchmaking/$projectId"
													params={{ projectId: project.id }}
												>
													Detail Vendor
												</Link>
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
