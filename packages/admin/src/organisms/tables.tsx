import type { AdminBlueprint, AdminUser } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { BLUEPRINT_META } from "../lib/demo-data";
import { formatDateTime } from "../lib/format";

interface AccountsTableProps {
	users: AdminUser[];
	limit?: number;
}

export function AccountsTable({ users, limit = 5 }: AccountsTableProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Akun Terbaru</CardTitle>
					<Button asChild variant="outline" className="!h-9 px-4 text-base">
						<Link to="/admin/users">Lihat selengkapnya</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
					<Table className="text-base">
						<TableHeader>
							<TableRow>
								<TableHead className="text-base text-muted-foreground">
									Pengguna
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Peran
								</TableHead>
								<TableHead className="text-center text-base text-muted-foreground">
									Perusahaan
								</TableHead>
								<TableHead className="text-center text-base text-muted-foreground">
									Profil Vendor
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Verifikasi
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Terdaftar
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.slice(0, limit).map((user) => {
								const verified = user.verifiedAt !== null;
								return (
									<TableRow key={user.id}>
										<TableCell>
											<p className="font-medium">{user.name}</p>
											<p className="text-base text-muted-foreground">
												{user.email}
											</p>
										</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												className="!h-8 rounded-md px-3 text-base"
											>
												{user.role}
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											{user.companyName ? (
												<span className="font-medium text-primary">✓</span>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell className="text-center">
											{user.vendorProfile ? (
												<span className="font-medium text-primary">✓</span>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell>
											<Badge
												variant={verified ? "default" : "destructive"}
												className="!h-8 rounded-md px-3 text-base"
											>
												{verified ? "Terverifikasi" : "Belum"}
											</Badge>
										</TableCell>
										<TableCell>{formatDateTime(user.createdAt)}</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

interface BlueprintsTableProps {
	blueprints: AdminBlueprint[];
	limit?: number;
}

export function BlueprintsTable({
	blueprints,
	limit = 5,
}: BlueprintsTableProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Blueprint Terbaru</CardTitle>
					<Button asChild variant="outline" className="!h-9 px-4 text-base">
						<Link to="/admin/projects">Lihat selengkapnya</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
					<Table className="text-base">
						<TableHeader>
							<TableRow>
								<TableHead className="text-base text-muted-foreground">
									Proyek
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Status
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Validasi
								</TableHead>
								<TableHead className="text-base text-muted-foreground">
									Catatan
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{blueprints.slice(0, limit).map((bp) => {
								const meta = BLUEPRINT_META[bp.status] ?? {
									label: bp.status,
									variant: "outline" as const,
								};
								return (
									<TableRow key={bp.id}>
										<TableCell className="max-w-64">
											<p className="truncate font-medium">{bp.projectTitle}</p>
											<p className="text-base text-muted-foreground">
												Blueprint #{bp.id}
											</p>
										</TableCell>
										<TableCell>
											<Badge
												variant={meta.variant}
												className="!h-8 rounded-md px-3 text-base"
											>
												{meta.label}
											</Badge>
										</TableCell>
										<TableCell>{formatDateTime(bp.validatedAt)}</TableCell>
										<TableCell className="max-w-40 truncate">
											{bp.auditNote ?? "—"}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
