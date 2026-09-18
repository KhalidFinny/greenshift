import type { AdminBlueprint, AdminUser } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DataTable,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { BLUEPRINT_META } from "../lib/demo-data";
import { formatDateTime } from "../lib/format";

const accountColumns: ColumnDef<AdminUser>[] = [
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
			<Badge variant="secondary" className="!h-8 rounded-md px-3 text-base">
				{row.original.role}
			</Badge>
		),
	},
	{
		id: "company",
		accessorFn: (user) => user.companyName !== null,
		header: "Company",
		meta: { className: "text-center", headClassName: "text-center" },
		cell: ({ row }) =>
			row.original.companyName ? (
				<span className="font-medium text-primary">✓</span>
			) : (
				<span className="text-muted-foreground">-</span>
			),
	},
	{
		id: "vendorProfile",
		accessorFn: (user) => user.vendorProfile,
		header: "Vendor Profile",
		meta: { className: "text-center", headClassName: "text-center" },
		cell: ({ row }) =>
			row.original.vendorProfile ? (
				<span className="font-medium text-primary">✓</span>
			) : (
				<span className="text-muted-foreground">-</span>
			),
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
					className="!h-8 rounded-md px-3 text-base"
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

const blueprintColumns: ColumnDef<AdminBlueprint>[] = [
	{
		id: "project",
		accessorFn: (bp) => bp.projectTitle,
		header: "Project",
		meta: { className: "max-w-64" },
		cell: ({ row }) => (
			<>
				<p className="truncate font-medium">{row.original.projectTitle}</p>
				<p className="text-base text-muted-foreground">
					Blueprint #{row.original.id}
				</p>
			</>
		),
	},
	{
		id: "status",
		accessorFn: (bp) => bp.status,
		header: "Status",
		cell: ({ row }) => {
			const meta = BLUEPRINT_META[row.original.status] ?? {
				label: row.original.status,
				variant: "outline" as const,
			};
			return (
				<Badge
					variant={meta.variant}
					className="!h-8 rounded-md px-3 text-base"
				>
					{meta.label}
				</Badge>
			);
		},
	},
	{
		id: "validation",
		accessorFn: (bp) => bp.validatedAt ?? "",
		header: "Validation",
		cell: ({ row }) => formatDateTime(row.original.validatedAt),
	},
	{
		id: "note",
		accessorFn: (bp) => bp.auditNote ?? "",
		header: "Note",
		meta: { className: "max-w-40 truncate" },
		cell: ({ row }) => row.original.auditNote ?? "-",
	},
];

interface AccountsTableProps {
	users: AdminUser[];
	limit?: number;
}

export function AccountsTable({ users, limit = 5 }: AccountsTableProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-xl">Latest Accounts</CardTitle>
					<Button asChild variant="outline" className="!h-9 px-4 text-base">
						<Link to="/admin/users">View more</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<DataTable
					columns={accountColumns}
					data={users.slice(0, limit)}
					getRowId={(user) => String(user.id)}
					ariaLabel="Latest accounts"
				/>
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
					<CardTitle className="text-xl">Latest Blueprints</CardTitle>
					<Button asChild variant="outline" className="!h-9 px-4 text-base">
						<Link to="/admin/projects">View more</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<DataTable
					columns={blueprintColumns}
					data={blueprints.slice(0, limit)}
					getRowId={(bp) => String(bp.id)}
					ariaLabel="Latest blueprints"
				/>
			</CardContent>
		</Card>
	);
}
