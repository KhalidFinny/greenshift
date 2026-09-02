import type { AdminUser } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	ContentSkeleton,
	EmptyState,
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
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";

const ROLE_LABELS: Record<string, string> = {
	business: "Bisnis",
	investor: "Investor",
	vendor: "Vendor",
	admin: "Admin",
};

const ROLE_OPTIONS = ["business", "investor", "vendor", "admin"] as const;

function UserRow({ user }: { user: AdminUser }) {
	const verified = user.verifiedAt !== null;
	return (
		<TableRow>
			<TableCell>
				<p className="font-medium">{user.name}</p>
				<p className="text-base text-muted-foreground">{user.email}</p>
			</TableCell>
			<TableCell>
				<Badge variant="secondary" className="text-base px-3 !h-8">
					{ROLE_LABELS[user.role] ?? user.role}
				</Badge>
			</TableCell>
			<TableCell className="max-w-56 truncate">
				{user.companyName ?? "—"}
			</TableCell>
			<TableCell>
				<Badge
					variant={verified ? "default" : "destructive"}
					className="text-base px-3 !h-8"
				>
					{verified ? "Terverifikasi" : "Belum diverifikasi"}
				</Badge>
			</TableCell>
			<TableCell>{formatDateTime(user.createdAt)}</TableCell>
		</TableRow>
	);
}

export function AdminUsers() {
	const [role, setRole] = useState<string>("all");

	const usersQuery = useQuery({
		queryKey: ["admin", "users", role],
		queryFn: () =>
			api.admin.users(role === "all" ? { limit: 200 } : { role, limit: 200 }),
	});

	if (usersQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (usersQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Gagal memuat pengguna"
					description="Tidak dapat mengambil data akun."
				/>
				<div>
					<Button variant="outline" onClick={() => usersQuery.refetch()}>
						Coba lagi
					</Button>
				</div>
			</div>
		);
	}

	const users = usersQuery.data.users;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Pengguna</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Pemantauan akun: peran, status verifikasi, dan waktu pendaftaran.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={role} onValueChange={(value) => setRole(value)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Semua peran" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua peran</SelectItem>
							{ROLE_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{ROLE_LABELS[option]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<ExportMenu
						filename="pengguna"
						title="Pengguna"
						sections={[
							{
								title: "Pengguna",
								headers: [
									"Nama",
									"Email",
									"Peran",
									"Perusahaan",
									"Verifikasi",
									"Terdaftar",
								],
								rows: users.map((user) => [
									user.name,
									user.email,
									ROLE_LABELS[user.role] ?? user.role,
									user.companyName ?? "—",
									user.verifiedAt !== null
										? "Terverifikasi"
										: "Belum diverifikasi",
									formatDateTime(user.createdAt),
								]),
							},
						]}
					/>
				</div>
			</div>

			{users.length === 0 ? (
				<EmptyState
					title="Tidak ada pengguna"
					description="Belum ada akun terdaftar pada filter ini."
				/>
			) : (
				<Card>
					<Table className="text-base" aria-label="Daftar pengguna">
						<TableHeader>
							<TableHead>Pengguna</TableHead>
							<TableHead>Peran</TableHead>
							<TableHead>Perusahaan</TableHead>
							<TableHead>Verifikasi</TableHead>
							<TableHead>Terdaftar</TableHead>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<UserRow key={user.id} user={user} />
							))}
						</TableBody>
					</Table>
				</Card>
			)}
		</div>
	);
}
