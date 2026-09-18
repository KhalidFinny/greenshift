import { faFileAlt, faLeaf, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { VendorPortfolioItem } from "../lib/types";

interface PortfolioItemCardProps {
	item: VendorPortfolioItem;
	onDelete?: (id: string) => void;
}

export function PortfolioItemCard({ item, onDelete }: PortfolioItemCardProps) {
	return (
		<Card className="relative flex flex-col justify-between">
			{onDelete && (
				<Button
					variant="ghost"
					size="sm"
					className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive hover:text-destructive"
					onClick={() => onDelete(item.id)}
				>
					<FontAwesomeIcon icon={faTrash} />
				</Button>
			)}
			<CardHeader className="space-y-2 pb-3 pr-10">
				<Badge className="w-fit bg-emerald-600 font-semibold text-white">
					Completed {item.completionYear}
				</Badge>
				<CardTitle className="line-clamp-2 text-base">
					{item.projectName}
				</CardTitle>
				<p className="text-xs font-medium text-muted-foreground">
					Client: {item.clientName} • {item.location}
				</p>
			</CardHeader>

			<CardContent className="space-y-4 text-xs">
				<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5">
					<div>
						<p className="text-muted-foreground">Project Value</p>
						<p className="mt-0.5 font-semibold text-foreground">
							{formatRupiah(item.projectValue)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Carbon Reduction</p>
						<p className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
							{item.carbonReductionTons} tCO₂e/yr
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between border-t border-border pt-2 text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
						Energy Saved {item.energySavingPercent}%
					</span>
					{item.documentName && (
						<span className="flex cursor-pointer items-center gap-1 text-xs text-blue-600 hover:underline">
							<FontAwesomeIcon icon={faFileAlt} />
							Document
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
