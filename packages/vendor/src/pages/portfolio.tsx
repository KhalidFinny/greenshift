import { useState } from "react";
import { faPencil, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { AddPortfolioDialog } from "../organisms/add-portfolio-dialog";
import { PortfolioItemCard } from "../organisms/portfolio-item-card";

export function VendorPortfolioPage() {
	const { portfolio, addPortfolioItem, deletePortfolioItem } = useVendorData();
	const [isEditMode, setIsEditMode] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-base font-semibold text-foreground">Portfolio</h3>
				<div className="flex items-center gap-2">
					<Button
						variant={isEditMode ? "destructive" : "outline"}
						size="sm"
						className="gap-2"
						onClick={() => setIsEditMode(!isEditMode)}
					>
						<FontAwesomeIcon icon={isEditMode ? faX : faPencil} />
						{isEditMode ? "Cancel" : "Edit"}
					</Button>
					<AddPortfolioDialog onAdd={addPortfolioItem} />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{portfolio.map((item) => (
					<PortfolioItemCard
						key={item.id}
						item={item}
						onDelete={isEditMode ? deletePortfolioItem : undefined}
					/>
				))}
			</div>
		</div>
	);
}
