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
import { ExportMenu } from "../molecules/export-menu";
import { CompanyVerificationDialog } from "../organisms/company-verification-dialog";
import { TableSkeleton } from "../organisms/table-skeleton";

const ROLE_LABELS: Record<string, string> = {
	business: "Company",
	investor: "Investor",
	vendor: "Vendor",
	broker: "Broker",
	admin: "Admin",
};

/** Every role the API can return, so the filter cannot hide a whole group. */
const ROLE_OPTIONS = [
	"business",
	"investor",
	"vendor",
	"broker",
	"admin",
] as const;

/** Column labels for the loading frame, in table order. */
const USER_HEADERS = [
	"User",
	"Role",
	"Company",
	"Verification",
	"Registered",
	"Actions",
];

/** The state as the roster reads it, so a pending company is not simply "no". */
const STATE_LABEL: Record<string, string> = {
	NOT_VERIFIED: "Not verified",
	NEEDS_RESCAN: "Clearer scan asked for",
	PENDING: "Waiting on a reviewer",
	REJECTED: "Turned down",
	VERIFIED: "Verified",
};

const userColumns = (
	onReview: (user: AdminUser) => void,
): ColumnDef<AdminUser>[] => [
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
		accessorFn: (user) =>
			`${user.companyName ?? ""} ${user.industrySector ?? ""} ${user.serviceCategory ?? ""} ${user.address ?? ""}`,
		header: "Company",
		meta: { className: "max-w-64" },
		cell: ({ row }) => {
			// A company carries a sector, a vendor a service category: the same fact about two kinds of organization.
			const category =
				row.original.industrySector ?? row.original.serviceCategory;
			const detail = [category, row.original.address]
				.filter((value): value is string => Boolean(value))
				.join(" · ");
			return (
				<>
					<p className="truncate">{row.original.companyName ?? "-"}</p>
					{detail ? (
						<p className="truncate text-base text-muted-foreground">{detail}</p>
					) : null}
				</>
			);
		},
	},
	{
		id: "verification",
		accessorFn: (user) =>
			user.verificationState ??
			(user.verifiedAt !== null ? "VERIFIED" : "NOT_VERIFIED"),
		header: "Verification",
		cell: ({ row }) => {
			const state =
				row.original.verificationState ??
				(row.original.verifiedAt !== null ? "VERIFIED" : "NOT_VERIFIED");
			return (
				<Badge
					variant={state === "VERIFIED" ? "default" : "destructive"}
					className="text-base px-3 !h-8"
				>
					{STATE_LABEL[state] ?? state}
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
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.role === "business" ? (
				<Button variant="outline" onClick={() => onReview(row.original)}>
					Review the pack
				</Button>
			) : null,
	},
];

export function AdminUsers() {
	const [role, setRole] = useState<string>("all");
	const [reviewing, setReviewing] = useState<AdminUser | null>(null);

	const usersQuery = useQuery({
		queryKey: ["admin", "users", role],
		queryFn: () =>
			api.admin.users(role === "all" ? { limit: 200 } : { role, limit: 200 }),
	});

	const loading = usersQuery.isPending;
	const users = usersQuery.data?.users ?? [];
	const columns = userColumns(setReviewing);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				<div className="flex w-full items-center gap-2 sm:w-auto">
					<Select value={role} onValueChange={(value) => setRole(value)}>
						<SelectTrigger className="w-full sm:w-[180px]">
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
						columns={columns}
						data={users}
						getRowId={(user) => String(user.id)}
						ariaLabel="User list"
						searchPlaceholder="Search users"
						emptyMessage="No users match your search."
					/>
				</Card>
			)}

			{reviewing ? (
				<CompanyVerificationDialog
					user={reviewing}
					open
					onOpenChange={(open) => {
						if (!open) setReviewing(null);
					}}
				/>
			) : null}
		</div>
	);
}
