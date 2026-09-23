import { faAward, faPencil, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	EmptyState,
	PaginationBar,
	usePagedRows,
} from "@greenshift/ui";
import { useState } from "react";
import { formatCompactRupiah } from "../lib/format";
import { useVendorData } from "../lib/use-vendor-data";
import { AddPortfolioDialog } from "../organisms/add-portfolio-dialog";
import { PortfolioItemCard } from "../organisms/portfolio-item-card";

export function VendorPortfolioPage() {
	const { isLoading, portfolio, addPortfolioItem, deletePortfolioItem } =
		useVendorData();
	const [isEditMode, setIsEditMode] = useState(false);
	const paged = usePagedRows(portfolio);

	// Totals are computed from the records on screen; nothing is estimated.
	const carbonRecords = portfolio.filter((i) => i.carbonReductionTons !== null);
	const totalCarbon = carbonRecords.reduce(
		(sum, i) => sum + (i.carbonReductionTons ?? 0),
		0,
	);
	const totalValue = portfolio.reduce((sum, i) => sum + i.projectValue, 0);

	return (
		<div className="space-y-6">
			{/* Page header. The shell already titles this page, so the heading here is
			    the purpose, not a repeat of the word "Portfolio". */}
			<div className="flex flex-wrap items-center justify-end gap-4">
				<div className="flex items-center gap-2">
					<Button
						variant={isEditMode ? "destructive" : "outline"}
						onClick={() => setIsEditMode(!isEditMode)}
						className="font-medium"
					>
						<FontAwesomeIcon icon={isEditMode ? faX : faPencil} />
						{isEditMode ? "Cancel" : "Edit records"}
					</Button>
					<AddPortfolioDialog onAdd={addPortfolioItem} />
				</div>
			</div>

			{portfolio.length > 0 ? (
				<dl className="flex flex-wrap items-center gap-x-10 gap-y-3 rounded-xl border border-border bg-card px-5 py-4">
					{[
						{ label: "Records", value: String(portfolio.length) },
						{
							label: "Carbon abated",
							value: carbonRecords.length
								? `${totalCarbon} tCO₂e/yr`
								: "Not reported",
							tone: "positive",
						},
						{
							label: "Delivered value",
							value: formatCompactRupiah(totalValue),
						},
					].map((stat) => (
						<div key={stat.label} className="flex items-baseline gap-2">
							<dt className="text-sm text-muted-foreground">{stat.label}</dt>
							<dd
								className={
									stat.tone === "positive"
										? "text-base font-semibold text-emerald-700 tabular-nums"
										: "text-base font-semibold text-foreground tabular-nums"
								}
							>
								{stat.value}
							</dd>
						</div>
					))}
				</dl>
			) : null}

			{!isLoading && portfolio.length === 0 ? (
				<EmptyState
					icon={<FontAwesomeIcon icon={faAward} />}
					title="No delivered work recorded yet"
					description="This is the evidence clients read before they shortlist you. Add a completed project, with its client, value, and measured carbon reduction."
					action={<AddPortfolioDialog onAdd={addPortfolioItem} />}
				/>
			) : (
				<>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{paged.pageRows.map((item) => (
							<PortfolioItemCard
								key={item.id}
								item={item}
								onDelete={isEditMode ? deletePortfolioItem : undefined}
							/>
						))}
					</div>
					<PaginationBar
						label="Portfolio records"
						pageIndex={paged.pageIndex}
						pageSize={paged.pageSize}
						pageCount={paged.pageCount}
						total={paged.total}
						onPageIndexChange={paged.setPageIndex}
						onPageSizeChange={paged.setPageSize}
					/>
				</>
			)}
		</div>
	);
}
