import type { AdminUser } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	DataTable,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";
import { TableSkeleton } from "../organisms/table-skeleton";

const ROLE_LABELS: Record<string, string> = {
	business: "Business",
	vendor: "Vendor",
	admin: "Admin",
};

const ROLE_OPTIONS = ["business", "vendor", "admin"] as const;

/** Column labels for the loading frame, in table order. */
const USER_HEADERS = ["User", "Role", "Company", "Verification", "Registered"];

const userColumns: ColumnDef<AdminUser>[] = [
	{
		id: "user",
		accessorFn: (user) => user.name,
		header: "User",
		cell: ({ row }) => (
			<>
				<p className="font-medium">{row.original.name}</p>
				<p className="text-base text-muted-foreground">{row.original.email}</p>
			</>
		),
	},
	{
		id: "role",
		accessorFn: (user) => user.role,
		header: "Role",
		cell: ({ row }) => (
			<Badge variant="secondary" className="text-base px-3 !h-8">
				{ROLE_LABELS[row.original.role] ?? row.original.role}
			</Badge>
		),
	},
	{
		id: "company",
		accessorFn: (user) => user.companyName ?? "",
		header: "Company",
		meta: { className: "max-w-56 truncate" },
		cell: ({ row }) => row.original.companyName ?? "-",
	},
	{
		id: "verification",
		accessorFn: (user) =>
			user.verifiedAt !== null ? "Verified" : "Not verified",
		header: "Verification",
		cell: ({ row }) => {
			const verified = row.original.verifiedAt !== null;
			return (
				<Badge
					variant={verified ? "default" : "destructive"}
					className="text-base px-3 !h-8"
				>
					{verified ? "Verified" : "Not verified"}
				</Badge>
			);
		},
	},
	{
		id: "registered",
		accessorFn: (user) => user.createdAt ?? "",
		header: "Registered",
		cell: ({ row }) => formatDateTime(row.original.createdAt),
	},
];

export function AdminUsers() {
	const [role, setRole] = useState<string>("all");

	const usersQuery = useQuery({
		queryKey: ["admin", "users", role],
		queryFn: () =>
			api.admin.users(role === "all" ? { limit: 200 } : { role, limit: 200 }),
	});

	const loading = usersQuery.isPending;
	const users = usersQuery.data?.users ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				<div className="flex items-center gap-2">
					<Select value={role} onValueChange={(value) => setRole(value)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All roles" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All roles</SelectItem>
							{ROLE_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{ROLE_LABELS[option]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{loading ? null : (
						<ExportMenu
							filename="users"
							title="Users"
							sections={[
								{
									title: "Users",
									headers: [
										"Name",
										"Email",
										"Role",
										"Company",
										"Verification",
										"Registered",
									],
									rows: users.map((user) => [
										user.name,
										user.email,
										ROLE_LABELS[user.role] ?? user.role,
										user.companyName ?? "-",
										user.verifiedAt !== null ? "Verified" : "Not verified",
										formatDateTime(user.createdAt),
									]),
								},
							]}
						/>
					)}
				</div>
			</div>

			{usersQuery.isError ? (
				<EmptyState
					tone="error"
					title="Accounts did not load"
					description="GET /api/admin/users did not answer, so no account rows could be retrieved."
					action={
						<Button variant="outline" onClick={() => usersQuery.refetch()}>
							Try again
						</Button>
					}
				/>
			) : loading ? (
				<Card className="overflow-hidden">
					<TableSkeleton headers={USER_HEADERS} search rows={5} />
				</Card>
			) : users.length === 0 ? (
				<EmptyState
					title="No accounts for this role"
					description={
						role === "all"
							? "No account has registered on the platform yet."
							: `No ${ROLE_LABELS[role] ?? role} account is registered. Widen the filter to see every account.`
					}
					action={
						role === "all" ? undefined : (
							<Button variant="outline" onClick={() => setRole("all")}>
								Show all roles
							</Button>
						)
					}
				/>
			) : (
				<Card>
					<DataTable
						columns={userColumns}
						data={users}
						getRowId={(user) => String(user.id)}
						ariaLabel="User list"
						searchPlaceholder="Search users"
						emptyMessage="No users match your search."
					/>
				</Card>
			)}
		</div>
	);
}
