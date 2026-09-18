import type { AdminUser } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	ContentSkeleton,
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

const ROLE_LABELS: Record<string, string> = {
	business: "Business",
	vendor: "Vendor",
	admin: "Admin",
};

const ROLE_OPTIONS = ["business", "vendor", "admin"] as const;

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

	if (usersQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (usersQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Failed to load users"
					description="Unable to retrieve account data."
				/>
				<div>
					<Button variant="outline" onClick={() => usersQuery.refetch()}>
						Try again
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
					<h1 className="text-2xl font-semibold">Users</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Account monitoring: role, verification status, and registration
						time.
					</p>
				</div>
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
				</div>
			</div>

			{users.length === 0 ? (
				<EmptyState
					title="No users"
					description="No registered accounts match this filter."
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
