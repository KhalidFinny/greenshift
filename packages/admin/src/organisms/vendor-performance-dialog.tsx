import type { AdminVendor } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	DataTable,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	EmptyState,
} from "@greenshift/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { RatingBar } from "./rating-bar";

interface VendorRow {
	vendor: AdminVendor;
	rank: number;
}

function vendorColumns(
	onViewDetails: (vendor: AdminVendor) => void,
): ColumnDef<VendorRow>[] {
	return [
		{
			id: "rank",
			accessorFn: (row) => row.rank,
			header: "#",
			enableSorting: false,
			meta: {
				headClassName: "w-12",
				className: "font-semibold tabular-nums text-muted-foreground",
			},
			cell: ({ row }) => row.original.rank,
		},
		{
			id: "company",
			accessorFn: (row) => row.vendor.companyName,
			header: "Company",
			meta: { className: "font-medium" },
			cell: ({ row }) => row.original.vendor.companyName,
		},
		{
			id: "rating",
			accessorFn: (row) => row.vendor.rating,
			header: "Rating",
			meta: { headClassName: "w-44" },
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<RatingBar rating={row.original.vendor.rating} className="w-24" />
					<span className="font-semibold tabular-nums">
						{row.original.vendor.rating.toFixed(1)}
					</span>
				</div>
			),
		},
		{
			id: "projects",
			accessorFn: (row) => row.vendor.totalProjects,
			header: "Projects",
			meta: {
				headClassName: "text-right",
				className: "text-right tabular-nums",
			},
			cell: ({ row }) => row.original.vendor.totalProjects,
		},
		{
			id: "verification",
			accessorFn: (row) =>
				row.vendor.verifiedAt !== null ? "Verified" : "Not verified",
			header: "Verification",
			cell: ({ row }) => {
				const verified = row.original.vendor.verifiedAt !== null;
				return (
					<Badge
						variant={verified ? "default" : "secondary"}
						className="!h-8 px-3 text-base rounded-md"
					>
						{verified ? "Verified" : "Not verified"}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			enableSorting: false,
			cell: ({ row }) => (
				<Button
					variant="outline"
					onClick={() => onViewDetails(row.original.vendor)}
				>
					Detail
				</Button>
			),
		},
	];
}

interface VendorPerformanceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	vendors: AdminVendor[];
	onViewDetails: (vendor: AdminVendor) => void;
}

export function VendorPerformanceDialog({
	open,
	onOpenChange,
	vendors,
	onViewDetails,
}: VendorPerformanceDialogProps) {
	const rows: VendorRow[] = [...vendors]
		.sort((a, b) => b.rating - a.rating)
		.map((vendor, index) => ({ vendor, rank: index + 1 }));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5">
					<DialogTitle className="text-xl font-semibold">
						Vendor Performance
					</DialogTitle>
					<DialogDescription className="text-base">
						Ranking of {rows.length} vendors, rating on a 0–5 scale.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					{rows.length === 0 ? (
						<div className="p-6">
							<EmptyState
								title="No vendor ratings yet"
								description="No vendor has a recorded rating, so there is no performance ranking to show. Ratings appear once vendors complete their first project."
							/>
						</div>
					) : (
						<DataTable
							columns={vendorColumns(onViewDetails)}
							data={rows}
							getRowId={(row) => String(row.vendor.id)}
							ariaLabel="Vendor performance"
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
