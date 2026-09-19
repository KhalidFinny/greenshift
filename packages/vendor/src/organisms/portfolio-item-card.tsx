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
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "../lib/format";
import type { VendorPortfolioItem } from "../lib/types";

interface PortfolioItemCardProps {
	item: VendorPortfolioItem;
	onDelete?: (id: string) => void;
}

export function PortfolioItemCard({ item, onDelete }: PortfolioItemCardProps) {
	return (
		<Card className="relative flex flex-col">
			{onDelete ? (
				<Button
					variant="ghost"
					size="icon-sm"
					className="absolute right-2 top-2 z-10 text-destructive hover:text-destructive"
					aria-label={`Remove ${item.projectName} from your portfolio`}
					onClick={() => onDelete(item.id)}
				>
					<FontAwesomeIcon icon={faTrash} />
				</Button>
			) : null}

			<CardHeader className="space-y-2 pb-3 pr-10">
				<Badge className="w-fit bg-emerald-700 font-semibold text-white">
					{item.status === "VERIFIED" ? "Verified" : "Completed"}
					{item.completionYear !== null ? ` ${item.completionYear}` : ""}
				</Badge>
				<CardTitle className="line-clamp-2 text-base">
					{item.projectName}
				</CardTitle>
				<p className="text-sm font-medium text-muted-foreground">
					{[item.clientName, item.location].filter(Boolean).join(" · ") ||
						"Client not recorded"}
				</p>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col space-y-4 text-sm">
				<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5">
					<div>
						<p className="text-muted-foreground">Project value</p>
						<p className="mt-0.5 font-semibold text-foreground tabular-nums">
							{formatRupiah(item.projectValue)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Carbon reduction</p>
						<p className="mt-0.5 font-semibold text-emerald-700 tabular-nums">
							{item.carbonReductionTons !== null
								? `${item.carbonReductionTons} tCO₂e/yr`
								: "Not reported"}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
						{item.energySavingKwh !== null
							? `Energy saved ${item.energySavingKwh.toLocaleString("en-US")} kWh/yr`
							: item.energySavingPercent !== null
								? `Energy saved ${item.energySavingPercent}%`
								: "Energy saving not reported"}
					</span>
					{item.documentName ? (
						<span className="flex items-center gap-1 text-sm text-blue-700">
							<FontAwesomeIcon icon={faFileAlt} />
							Document
						</span>
					) : null}
				</div>

				<div className="mt-auto border-t border-border pt-4">
					<Link
						to="/vendor/portfolio/$id"
						params={{ id: item.id }}
						className="block no-underline"
					>
						<Button className="w-full bg-[#00712D] text-white hover:bg-[#00712D]/90">
							View details
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
