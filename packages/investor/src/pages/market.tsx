import { faArrowLeft, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ObligasiListing } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { Button, ContentSkeleton, cn, EmptyState } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PRIMARY_BROKER } from "../lib/broker-platforms";
import { DEMO_OBLIGASI } from "../lib/demo-data";
import { ObligasiCard } from "../organisms/market-card";

type ObligasiTab = "verified" | "on_progress";

function ListingGrid({ listings }: { listings: ObligasiListing[] }) {
	if (listings.length === 0) {
		return (
			<EmptyState
				title="Belum ada obligasi"
				description="Belum ada obligasi pada kategori ini saat ini."
			/>
		);
	}
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{listings.map((listing) => (
				<ObligasiCard key={listing.id} listing={listing} />
			))}
		</div>
	);
}

export function ObligasiPage() {
	const query = useQuery({
		queryKey: ["investor", "market"],
		queryFn: () => api.investor.market(),
	});
	const [tab, setTab] = useState<ObligasiTab>("verified");

	const live = query.data?.obligasi ?? [];
	const source = query.isSuccess
		? live.length > 0
			? live
			: DEMO_OBLIGASI
		: [];

	const verified = source.filter((listing) => listing.status === "verified");
	const onProgress = source.filter(
		(listing) => listing.status === "on_progress",
	);
	const tabs: Array<{ value: ObligasiTab; label: string; count: number }> = [
		{ value: "verified", label: "Terverifikasi", count: verified.length },
		{ value: "on_progress", label: "Dalam Proses", count: onProgress.length },
	];

	return (
		<main className="pb-20">
			{/* Sticky command bar: back button stays reachable while the list scrolls. */}
			<div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
				<div className="page-wrap mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link to="/">
						<Button variant="outline" size="lg">
							<FontAwesomeIcon icon={faArrowLeft} />
							Kembali ke Beranda
						</Button>
					</Link>
					<span className="hidden text-sm text-muted-foreground sm:block">
						{source.length} obligasi terdaftar
					</span>
				</div>
			</div>

			<div className="page-wrap mx-auto max-w-7xl px-4 py-8 sm:px-6">
				<header className="max-w-3xl">
					<h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
						Obligasi Hijau
					</h1>
				</header>

				<div className="mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
					<FontAwesomeIcon
						icon={faCircleInfo}
						className="mt-0.5 size-5 shrink-0 text-primary"
					/>
					<p className="text-sm leading-relaxed text-muted-foreground">
						<span className="font-medium text-foreground">
							{PRIMARY_BROKER.name}
						</span>{" "}
						{PRIMARY_BROKER.note} Tombol beli akan membuka aplikasi broker; bila
						belum terpasang kami arahkan ke Google Play, dan Anda selalu bisa
						menyalin kode obligasi untuk dicari manual.
					</p>
				</div>

				{query.isPending ? (
					<div className="mt-8">
						<ContentSkeleton />
					</div>
				) : query.isError ? (
					<div className="mt-8">
						<EmptyState
							title="Gagal memuat obligasi"
							description="Tidak dapat mengambil daftar obligasi saat ini."
						/>
					</div>
				) : (
					<>
						<div className="mt-8 inline-flex flex-wrap gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
							{tabs.map((item) => (
								<button
									key={item.value}
									type="button"
									onClick={() => setTab(item.value)}
									className={cn(
										"rounded-md px-4 py-2 text-base font-medium transition-colors",
										tab === item.value
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{item.label} ({item.count})
								</button>
							))}
						</div>

						<div className="mt-6">
							<ListingGrid
								listings={tab === "verified" ? verified : onProgress}
							/>
						</div>
					</>
				)}
			</div>
		</main>
	);
}
