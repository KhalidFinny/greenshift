import { useEffect, useState } from "react";
import type { AdminVendor } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { RatingBar } from "./rating-bar";

const PAGE_SIZE = 8;

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
	const [page, setPage] = useState(1);
	const sorted = [...vendors].sort((a, b) => b.rating - a.rating);
	const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
	const safePage = Math.min(page, pageCount);
	const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	useEffect(() => {
		if (open) setPage(1);
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5">
					<DialogTitle className="text-xl font-semibold">
						Vendor Performance
					</DialogTitle>
					<DialogDescription className="text-base">
						Peringkat {sorted.length} vendor — rating pada skala 0–5.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					{sorted.length === 0 ? (
						<p className="p-6 text-base text-muted-foreground">
							Belum ada data vendor.
						</p>
					) : (
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">#</TableHead>
									<TableHead>Perusahaan</TableHead>
									<TableHead className="w-44">Rating</TableHead>
									<TableHead className="text-right">Proyek</TableHead>
									<TableHead>Verifikasi</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((vendor, index) => {
									const rank = (safePage - 1) * PAGE_SIZE + index + 1;
									const verified = vendor.verifiedAt !== null;
									return (
										<TableRow key={vendor.id}>
											<TableCell className="font-semibold tabular-nums text-muted-foreground">
												{rank}
											</TableCell>
											<TableCell className="font-medium">
												{vendor.companyName}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<RatingBar rating={vendor.rating} className="w-24" />
													<span className="font-semibold tabular-nums">
														{vendor.rating.toFixed(1)}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{vendor.totalProjects}
											</TableCell>
											<TableCell>
												<Badge
													variant={verified ? "default" : "secondary"}
													className="!h-8 px-3 text-base rounded-md"
												>
													{verified ? "Terverifikasi" : "Belum"}
												</Badge>
											</TableCell>
											<TableCell>
												<Button
													variant="outline"
													onClick={() => onViewDetails(vendor)}
												>
													Detail
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</div>

				<DialogFooter className="shrink-0 items-center justify-between border-t border-border px-6 py-4">
					<p className="text-base text-muted-foreground">
						Halaman {safePage} dari {pageCount}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							disabled={safePage <= 1}
							onClick={() => setPage(safePage - 1)}
						>
							Sebelumnya
						</Button>
						<Button
							disabled={safePage >= pageCount}
							onClick={() => setPage(safePage + 1)}
						>
							Berikutnya
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
