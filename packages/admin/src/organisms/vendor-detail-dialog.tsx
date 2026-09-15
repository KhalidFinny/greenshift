import type { AdminVendor } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@greenshift/ui";
import { formatDateTime } from "../lib/format";
import { RatingBar } from "./rating-bar";

interface VendorDetailDialogProps {
	vendor: AdminVendor | null;
	onOpenChange: (open: boolean) => void;
}

export function VendorDetailDialog({
	vendor,
	onOpenChange,
}: VendorDetailDialogProps) {
	if (!vendor) return null;

	const verified = vendor.verifiedAt !== null;

	return (
		<Dialog open={vendor !== null} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 space-y-1">
							<DialogTitle className="truncate text-xl font-semibold">
								{vendor.companyName}
							</DialogTitle>
							<DialogDescription className="text-base">
								{vendor.email}
							</DialogDescription>
						</div>
						<Badge
							variant={verified ? "default" : "secondary"}
							className="shrink-0 !h-8 px-3 text-base rounded-md"
						>
							{verified ? "Terverifikasi" : "Belum diverifikasi"}
						</Badge>
					</div>
				</DialogHeader>

				<div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
					{vendor.description ? (
						<p className="text-base leading-relaxed">{vendor.description}</p>
					) : null}

					<dl className="grid grid-cols-2 gap-x-6 gap-y-4">
						<div>
							<dt className="text-base text-muted-foreground">Rating</dt>
							<dd className="mt-1 flex items-center gap-2">
								<RatingBar rating={vendor.rating} className="w-24" />
								<span className="text-base font-semibold tabular-nums">
									{vendor.rating.toFixed(1)}
								</span>
							</dd>
						</div>
						<div>
							<dt className="text-base text-muted-foreground">Total Proyek</dt>
							<dd className="mt-1 text-base font-semibold tabular-nums">
								{vendor.totalProjects}
							</dd>
						</div>
						<div>
							<dt className="text-base text-muted-foreground">Terdaftar</dt>
							<dd className="mt-1 text-base font-semibold tabular-nums">
								{formatDateTime(vendor.createdAt)}
							</dd>
						</div>
						<div>
							<dt className="text-base text-muted-foreground">Verifikasi</dt>
							<dd className="mt-1 text-base font-semibold tabular-nums">
								{verified ? formatDateTime(vendor.verifiedAt) : "Belum"}
							</dd>
						</div>
					</dl>

					<section className="space-y-2">
						<h3 className="text-base font-semibold">Sertifikasi</h3>
						{vendor.certifications.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{vendor.certifications.map((cert) => (
									<Badge
										key={cert}
										variant="secondary"
										className="!h-8 px-3 text-base rounded-md"
									>
										{cert}
									</Badge>
								))}
							</div>
						) : (
							<p className="text-base text-muted-foreground">-</p>
						)}
					</section>

					<section className="space-y-2">
						<h3 className="text-base font-semibold">Portofolio</h3>
						{vendor.portfolio.length > 0 ? (
							<ul className="space-y-1">
								{vendor.portfolio.map((item) => (
									<li key={item} className="text-base">
										• {item}
									</li>
								))}
							</ul>
						) : (
							<p className="text-base text-muted-foreground">-</p>
						)}
					</section>
				</div>

				<DialogFooter className="shrink-0 border-t border-border px-6 py-4">
					<DialogClose asChild>
						<Button variant="outline">Tutup</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
